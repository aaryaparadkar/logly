import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import {
  GithubService,
  GithubCommit,
  GithubRepo,
} from "../github/github.service";
import {
  AiService,
  ChangeEntry,
  CategorizedCommit,
  ChangeType,
} from "../ai/ai.service";
import {
  CreateChangelogDto,
  UpdateChangelogDto,
  ChangelogDataDto,
  ChangeEntryDto,
  VersionDto,
} from "./dto/changelog.dto";
import { DatabaseService } from "../../db/database.service";
import { changelogs, changelogVersions } from "../../db/schema";

export interface ChangelogData {
  name: string;
  logoUrl?: string;
  versions: Array<{
    id: string;
    version: string;
    date: string;
    entries: ChangeEntry[];
  }>;
}

export interface ChangelogStats {
  versions: number;
  changes: number;
  contributors: number;
}

@Injectable()
export class ChangelogService {
  constructor(
    private githubService: GithubService,
    private aiService: AiService,
    private db: DatabaseService,
  ) {}

  async generateChangelog(dto: CreateChangelogDto) {
    const { owner, repo, token, limit = 100 } = dto;

    try {
      const db = this.db.getDrizzle();
      const existingChangelog = await db.query.changelogs.findFirst({
        where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
      });

      if (existingChangelog && existingChangelog.data) {
        const versions = await db.query.changelogVersions.findMany({
          where: eq(changelogVersions.changelogId, existingChangelog.id),
        });

        return {
          owner,
          repo,
          data: {
            name: existingChangelog.name || repo,
            logoUrl: existingChangelog.logoUrl || undefined,
            versions: versions.map((v) => ({
              id: v.id,
              version: v.version,
              date: v.date,
              entries: v.entries as ChangeEntry[],
            })),
          },
          stats: {
            versions: versions.length,
            changes: versions.reduce(
              (acc, v) => acc + (v.entries as ChangeEntry[]).length,
              0,
            ),
            contributors: 1,
          },
          lastUpdated: existingChangelog.updatedAt.toISOString(),
          defaultBranch: "main",
        };
      }
    } catch (error) {
      console.error("Database error, falling back to API:", error);
    }

    let repoInfo: GithubRepo;
    try {
      repoInfo = await this.githubService.getRepo(owner, repo, token);
    } catch (error) {
      throw new NotFoundException(`Repository ${owner}/${repo} not found`);
    }

    const commits = await this.githubService.getCommits(owner, repo, token, {
      limit,
    });

    if (commits.length === 0) {
      throw new BadRequestException("No commits found in this repository");
    }

    let categorizedCommits: CategorizedCommit[];

    if (this.aiService.isConfigured()) {
      try {
        categorizedCommits = await this.aiService.categorizeCommits(commits);
      } catch (error) {
        console.error("AI categorization failed, using fallback:", error);
        categorizedCommits = this.fallbackCategorize(commits);
      }
    } else {
      categorizedCommits = this.fallbackCategorize(commits);
    }

    const { data, stats } = this.buildChangelogData(
      repoInfo,
      categorizedCommits,
    );

    return {
      owner,
      repo,
      data,
      stats,
      lastUpdated: repoInfo.pushed_at,
      defaultBranch: repoInfo.default_branch,
    };
  }

  private fallbackCategorize(commits: GithubCommit[]): CategorizedCommit[] {
    return commits.map((commit) => {
      const msg = (commit.commit?.message || "").toLowerCase();
      const fullMsg = commit.commit?.message || "";
      const msgLines = fullMsg.split("\n");
      const firstLine = msgLines[0] || "";
      const bodyLines = msgLines.slice(1).filter((l) => l.trim());
      const body = bodyLines.join(" ").trim();

      let type: ChangeType = "chore";

      if (
        msg.includes("feat") ||
        msg.includes("feature") ||
        msg.includes("add")
      )
        type = "feature";
      else if (
        msg.includes("fix") ||
        msg.includes("bug") ||
        msg.includes("fix")
      )
        type = "fix";
      else if (
        msg.includes("improve") ||
        msg.includes("enhance") ||
        msg.includes("optimize")
      )
        type = "improvement";
      else if (msg.includes("break") || msg.includes("migration"))
        type = "breaking";
      else if (msg.includes("doc") || msg.includes("readme")) type = "docs";

      return {
        type,
        title: firstLine.slice(0, 80),
        description: body || firstLine,
        commit,
      };
    });
  }

  private buildChangelogData(
    repo: GithubRepo,
    commits: CategorizedCommit[],
  ): { data: ChangelogData; stats: ChangelogStats } {
    const contributors = new Set<string>();
    const entries: ChangeEntry[] = commits.map((c, index) => {
      const author = c.commit.commit?.author;
      if (author?.email) {
        contributors.add(author.email);
      }
      return {
        id: `entry-${index}-${c.commit.sha.slice(0, 6)}`,
        type: c.type,
        title: c.title,
        description: c.description || "",
        commitHash: c.commit.sha,
        author: author?.name || c.commit.author?.login || "Unknown",
        date: author?.date || new Date().toISOString(),
      };
    });

    const groupedByType = this.groupByType(entries);

    const version: ChangelogData["versions"][0] = {
      id: `v1-${Date.now()}`,
      version: "v1.0.0",
      date: new Date().toISOString().split("T")[0] || "",
      entries,
    };

    return {
      data: {
        name: repo.name,
        logoUrl: repo.owner.avatar_url,
        versions: [version],
      },
      stats: {
        versions: 1,
        changes: entries.length,
        contributors: contributors.size,
      },
    };
  }

  private groupByType(
    entries: ChangeEntry[],
  ): Record<ChangeType, ChangeEntry[]> {
    const grouped: Record<ChangeType, ChangeEntry[]> = {
      feature: [],
      fix: [],
      improvement: [],
      breaking: [],
      docs: [],
      chore: [],
    };

    for (const entry of entries) {
      grouped[entry.type].push(entry);
    }

    return grouped;
  }

  async regenerateEntry(
    owner: string,
    repo: string,
    entryId: string,
    token?: string,
  ): Promise<ChangeEntry> {
    if (token) {
      const hasAccess = await this.githubService.verifyWriteAccess(
        owner,
        repo,
        token,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          "You do not have write access to this repository",
        );
      }
    }

    const { data: currentData } = await this.generateChangelog({
      owner,
      repo,
      token,
      limit: 1,
    });

    let targetEntry: ChangeEntry | undefined;
    for (const version of currentData.versions) {
      const found = version.entries.find((e) => e.id === entryId);
      if (found) {
        targetEntry = found;
        break;
      }
    }

    if (!targetEntry) {
      throw new NotFoundException("Entry not found");
    }

    const regenerated = await this.aiService.regenerateEntry(
      targetEntry.title,
      targetEntry.description || "",
      targetEntry.type,
    );

    return {
      ...targetEntry,
      title: regenerated.title,
      description: regenerated.description,
    };
  }

  async updateChangelog(
    owner: string,
    repo: string,
    data: ChangelogDataDto,
    token?: string,
  ): Promise<{ success: boolean }> {
    if (token) {
      const hasAccess = await this.githubService.verifyWriteAccess(
        owner,
        repo,
        token,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          "You do not have write access to this repository to save changes",
        );
      }
    }

    try {
      const db = this.db.getDrizzle();

      const existingChangelog = await db.query.changelogs.findFirst({
        where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
      });

      if (existingChangelog) {
        await db
          .update(changelogs)
          .set({
            name: data.name,
            data: data,
            updatedAt: new Date(),
          })
          .where(eq(changelogs.id, existingChangelog.id));

        await db
          .delete(changelogVersions)
          .where(eq(changelogVersions.changelogId, existingChangelog.id));

        for (const version of data.versions) {
          await db.insert(changelogVersions).values({
            changelogId: existingChangelog.id,
            version: version.version,
            date: version.date,
            entries: version.entries,
          });
        }
      } else {
        const [newChangelog] = await db
          .insert(changelogs)
          .values({
            owner,
            repo,
            name: data.name,
            data: data,
            isPublic: true,
          })
          .returning();

        if (!newChangelog) {
          throw new Error("Failed to create changelog");
        }

        for (const version of data.versions) {
          await db.insert(changelogVersions).values({
            changelogId: newChangelog.id,
            version: version.version,
            date: version.date,
            entries: version.entries,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Database error saving changelog:", error);
      return { success: true };
    }
  }

  buildExportMarkdown(data: ChangelogDataDto): string {
    let md = `# Changelog\n\n`;

    for (const version of data.versions) {
      md += `## ${version.date} - ${version.version}\n\n`;

      const entries = version.entries.map((e) => ({
        id: e.id || "",
        type: e.type,
        title: e.title || "",
        description: e.description,
        commitHash: e.commitHash || "",
        author: e.author || "",
        date: e.date,
      }));
      const grouped = this.groupByType(entries);

      const typeOrder: ChangeType[] = [
        "breaking",
        "feature",
        "fix",
        "improvement",
        "docs",
        "chore",
      ];
      const typeLabels: Record<ChangeType, string> = {
        breaking: "Breaking Changes",
        feature: "Features",
        fix: "Bug Fixes",
        improvement: "Improvements",
        docs: "Documentation",
        chore: "Chore",
      };

      for (const type of typeOrder) {
        const entries = grouped[type];
        if (entries.length > 0) {
          md += `### ${typeLabels[type]}\n\n`;
          for (const entry of entries) {
            md += `- ${entry.title}\n`;
            if (entry.description && entry.description !== entry.title) {
              md += `  - ${entry.description}\n`;
            }
          }
          md += "\n";
        }
      }
    }

    return md;
  }

  buildExportJson(data: ChangelogDataDto): object {
    return {
      generated: new Date().toISOString(),
      changelog: data,
    };
  }

  buildExportHtml(data: ChangelogDataDto): string {
    const typeColors: Record<ChangeType, string> = {
      feature: "#3b82f6",
      fix: "#22c55e",
      improvement: "#8b5cf6",
      breaking: "#ef4444",
      docs: "#64748b",
      chore: "#78716c",
    };

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.name} Changelog</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #333; }
    h3 { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; margin-right: 8px; }
  </style>
</head>
<body>
  <h1>${data.name} Changelog</h1>`;

    for (const version of data.versions) {
      html += `\n  <h2>${version.version} - ${version.date}</h2>`;

      const entries = version.entries.map((e) => ({
        id: e.id || "",
        type: e.type,
        title: e.title || "",
        description: e.description,
        commitHash: e.commitHash || "",
        author: e.author || "",
        date: e.date,
      }));
      const grouped = this.groupByType(entries);
      const typeOrder: ChangeType[] = [
        "breaking",
        "feature",
        "fix",
        "improvement",
        "docs",
        "chore",
      ];
      const typeLabels: Record<ChangeType, string> = {
        breaking: "Breaking Changes",
        feature: "Features",
        fix: "Bug Fixes",
        improvement: "Improvements",
        docs: "Documentation",
        chore: "Chore",
      };

      for (const type of typeOrder) {
        const entries = grouped[type];
        if (entries.length > 0) {
          html += `\n  <h3>${typeLabels[type]}</h3>\n  <ul>`;
          for (const entry of entries) {
            html += `\n    <li><span class="badge" style="background: ${typeColors[type]}">${type}</span>${entry.title}</li>`;
          }
          html += "\n  </ul>";
        }
      }
    }

    html += "\n</body>\n</html>";
    return html;
  }

  buildDynamicHtml(
    initialData: ChangelogDataDto,
    owner: string,
    repo: string,
    apiUrl: string,
  ): string {
    const typeColors: Record<ChangeType, string> = {
      feature: "#3b82f6",
      fix: "#22c55e",
      improvement: "#8b5cf6",
      breaking: "#ef4444",
      docs: "#64748b",
      chore: "#78716c",
    };

    // Build initial data without owner/repo fields
    const initialDataClean = {
      name: initialData.name,
      logoUrl: initialData.logoUrl,
      versions: initialData.versions,
    };
    const initialJson = JSON.stringify(initialDataClean).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${initialData.name} Changelog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; background: #fafafa; }
    .container { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
    h2 { margin-top: 24px; color: #333; font-size: 18px; }
    h3 { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 16px; font-weight: 600; }
    ul { padding-left: 0; list-style: none; }
    li { margin: 6px 0; padding: 8px 12px; background: #f9fafb; border-radius: 6px; display: flex; align-items: flex-start; gap: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; text-transform: uppercase; flex-shrink: 0; }
    .desc { color: #666; font-size: 13px; margin-top: 4px; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .error { text-align: center; padding: 40px; color: #ef4444; }
    .last-updated { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    .refresh { text-align: center; padding: 20px; }
    .refresh button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .refresh button:hover { background: #2563eb; }
    .refresh button:disabled { background: #9ca3af; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="title">${initialData.name} Changelog</h1>
    <div id="content">
      <div class="loading">Loading changelog...</div>
    </div>
    <div class="last-updated" id="updated"></div>
    <div class="refresh"><button id="refreshBtn" onclick="refreshChangelog()">Refresh</button></div>
  </div>

  <script>
    const API_URL = ${JSON.stringify(apiUrl)};
    const OWNER = ${JSON.stringify(owner)};
    const REPO = ${JSON.stringify(repo)};
    
    // Group entries by type
    function groupByType(entries) {
      const groups = {};
      for (const entry of entries) {
        const type = entry.type || "chore";
        if (!groups[type]) groups[type] = [];
        groups[type].push(entry);
      }
      return groups;
    }

    // Render changelog data
    function render(data) {
      const content = document.getElementById("content");
      const title = document.getElementById("title");
      const updated = document.getElementById("updated");
      
      title.textContent = (data.name || "Changelog") + " Changelog";
      
      if (!data.versions || data.versions.length === 0) {
        content.innerHTML = '<div class="loading">No changelog entries found.</div>';
        return;
      }

      const typeOrder = ["breaking", "feature", "fix", "improvement", "docs", "chore"];
      const typeLabels = {
        breaking: "Breaking Changes",
        feature: "Features", 
        fix: "Bug Fixes",
        improvement: "Improvements",
        docs: "Documentation",
        chore: "Chore"
      };

      let html = "";
      for (const version of data.versions) {
        html += "<h2>" + version.version + " - " + version.date + "</h2>";
        
        const entries = version.entries.map(e => ({
          id: e.id || "",
          type: e.type,
          title: e.title || "",
          description: e.description,
          commitHash: e.commitHash || "",
          author: e.author || "",
          date: e.date
        }));
        
        const grouped = groupByType(entries);
        
        for (const type of typeOrder) {
          const entries = grouped[type];
          if (entries && entries.length > 0) {
            html += "<h3>" + typeLabels[type] + "</h3><ul>";
            for (const entry of entries) {
              html += "<li>";
              html += '<span class="badge" style="background:' + (${JSON.stringify(JSON.stringify(typeColors))}[type] || "#78716c") + '">' + type + "</span>";
              html += "<div>";
              html += "<strong>" + entry.title + "</strong>";
              if (entry.description) {
                html += '<div class="desc">' + entry.description + "</div>";
              }
              html += "</div>";
              html += "</li>";
            }
            html += "</ul>";
          }
        }
      }

      content.innerHTML = html;
      updated.textContent = "Last updated: " + new Date().toLocaleString();
    }

    // Initial data
    let changelogData = ${initialJson};
    render(changelogData);

    // Refresh from API
    async function refreshChangelog() {
      const btn = document.getElementById("refreshBtn");
      btn.disabled = true;
      btn.textContent = "Loading...";
      
      try {
        const res = await fetch(API_URL + "/api/changelogs/" + OWNER + "/" + REPO);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        changelogData = json.data || json;
        render(changelogData);
      } catch (e) {
        document.getElementById("content").innerHTML = '<div class="error">Error loading changelog: ' + e.message + "</div>";
      } finally {
        btn.disabled = false;
        btn.textContent = "Refresh";
      }
    }

    // Auto-refresh every 5 minutes
    setInterval(refreshChangelog, 5 * 60 * 1000);
  </script>
</body>
</html>`;
  }
}
