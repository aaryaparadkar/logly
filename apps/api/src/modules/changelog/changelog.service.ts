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

    const typeLabels: Record<ChangeType, string> = {
      feature: "Features",
      fix: "Bug Fixes",
      improvement: "Improvements",
      breaking: "Breaking Changes",
      docs: "Documentation",
      chore: "Chore",
    };

    const borderColors: Record<ChangeType, string> = {
      feature: "border-blue-500/20 bg-blue-50",
      fix: "border-emerald-500/20 bg-emerald-50",
      improvement: "border-violet-500/20 bg-violet-50",
      breaking: "border-red-500/20 bg-red-50",
      docs: "border-slate-500/20 bg-slate-50",
      chore: "border-stone-500/20 bg-stone-50",
    };

    const textColors: Record<ChangeType, string> = {
      feature: "text-blue-700",
      fix: "text-emerald-700",
      improvement: "text-violet-700",
      breaking: "text-red-700",
      docs: "text-slate-700",
      chore: "text-stone-700",
    };

    // Build initial data without owner/repo fields
    const initialDataClean = {
      name: initialData.name,
      logoUrl: initialData.logoUrl,
      versions: initialData.versions,
    };
    const initialJson = JSON.stringify(initialDataClean).replace(/</g, "\\u003c");
    const repoUrl = `https://github.com/${owner}/${repo}`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${initialData.name} Changelog</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --background: #ffffff; --foreground: #0f172a; --muted-foreground: #64748b; --border: #e2e8f0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--background); color: var(--foreground); line-height: 1.6; }
    .container { max-width: 48rem; margin: 0 auto; padding: 2.5rem 1.5rem; }
    .header { margin-bottom: 2.5rem; border-b: 1px solid var(--border); padding-bottom: 1.5rem; }
    .title-row { display: flex; align-items: center; justify-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem; }
    .title { font-size: 1.5rem; font-weight: 600; color: var(--foreground); display: flex; align-items: center; gap: 0.5rem; }
    .repo-link { font-size: 0.875rem; color: var(--muted-foreground); }
    .repo-link a { color: var(--muted-foreground); text-decoration: none; }
    .repo-link a:hover { text-decoration: underline; }
    .meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--muted-foreground); }
    .versions { margin-top: 3rem; }
    .version { margin-top: 3rem; }
    .version-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .version-tag { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; background: var(--foreground); color: var(--background); border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; }
    .version-date { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: var(--muted-foreground); }
    .entries { padding-left: 1rem; border-left: 2px solid var(--border); }
    .entry { padding: 1.25rem 0; display: flex; gap: 1rem; }
    .entry:first-child { padding-top: 0; }
    .entry:last-child { padding-bottom: 0; }
    .entry:not(:last-child) { border-bottom: 1px solid var(--border); }
    .type-col { width: 5rem; flex-shrink: 0; }
    .type-badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; border: 1px solid transparent; width: 100%; }
    .content { flex: 1; min-width: 0; }
    .entry-title { font-size: 0.9375rem; font-weight: 500; color: var(--foreground); }
    .entry-desc { margin-top: 0.5rem; font-size: 0.875rem; color: var(--muted-foreground); }
    .entry-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; font-size: 0.75rem; color: var(--muted-foreground); }
    .entry-meta a { display: inline-flex; align-items: center; gap: 0.375rem; }
    .entry-meta a:hover { color: var(--foreground); }
    .loading { text-align: center; padding: 3rem; color: var(--muted-foreground); }
    .error { text-align: center; padding: 3rem; color: #ef4444; }
    .footer { margin-top: 4rem; border-t: 1px solid var(--border); padding: 1.5rem 0; text-align: center; }
    .footer a { color: var(--muted-foreground); text-decoration: none; font-size: 0.75rem; }
    .footer a:hover { text-decoration: underline; }
    .refresh-btn { background: var(--foreground); color: var(--background); border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; }
    .refresh-btn:hover { opacity: 0.9; }
    .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="title-row">
        <h1 class="title" id="title">${initialData.name} Changelog</h1>
      </div>
      <div class="repo-link">
        <a href="${repoUrl}" target="_blank" rel="noopener">${owner}/${repo}</a>
      </div>
      <div class="meta">
        <span id="updated"></span>
      </div>
    </header>
    <div id="content">
      <div class="loading">Loading changelog...</div>
    </div>
    <footer class="footer">
      <button class="refresh-btn" id="refreshBtn" onclick="refreshChangelog()">Refresh</button>
      <div style="margin-top: 0.5rem;">
        Generated with <a href="/">logly</a>
      </div>
    </footer>
  </div>

  <script>
    const API_URL = ${JSON.stringify(apiUrl)};
    const OWNER = ${JSON.stringify(owner)};
    const REPO = ${JSON.stringify(repo)};
    const REPO_URL = ${JSON.stringify(repoUrl)};
    
    const TYPE_COLORS = ${JSON.stringify(typeColors)};
    const TYPE_LABELS = ${JSON.stringify(typeLabels)};
    const BORDER_COLORS = ${JSON.stringify(borderColors)};
    const TEXT_COLORS = ${JSON.stringify(textColors)};
    
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

    // Format date
    function formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }

    // Render changelog data
    function render(data) {
      const content = document.getElementById("content");
      const title = document.getElementById("title");
      const updated = document.getElementById("updated");
      
      title.textContent = (data.name || "Changelog") + " Changelog";
      
      if (!data.versions || data.versions.length === 0) {
        content.innerHTML = '<div class="loading">No changelog entries found.</div>';
        updated.textContent = "";
        return;
      }

      const typeOrder = ["breaking", "feature", "fix", "improvement", "docs", "chore"];

      let html = '<div class="versions">';
      for (const version of data.versions) {
        html += '<section class="version">';
        html += '<div class="version-header">';
        html += '<span class="version-tag">' + version.version + '</span>';
        html += '<span class="version-date">📅 ' + formatDate(version.date) + '</span>';
        html += '</div>';
        
        html += '<div class="entries">';
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
          const typeEntries = grouped[type];
          if (typeEntries && typeEntries.length > 0) {
            for (const entry of typeEntries) {
              const colorKey = type === "breaking" ? "breaking" : type;
              html += '<div class="entry">';
              html += '<div class="type-col"><span class="type-badge ' + BORDER_COLORS[colorKey] + " " + TEXT_COLORS[colorKey] + '">' + TYPE_LABELS[type] + '</span></div>';
              html += '<div class="content">';
              html += '<h4 class="entry-title">' + entry.title + '</h4>';
              if (entry.description && entry.description !== entry.title) {
                html += '<p class="entry-desc">' + entry.description + '</p>';
              }
              html += '<div class="entry-meta">';
              if (entry.commitHash) {
                html += '<a href="https://github.com/' + OWNER + '/' + REPO + '/commit/' + entry.commitHash + '" target="_blank" rel="noopener"><code>' + entry.commitHash.slice(0, 7) + '</code> ↗</a>';
              }
              if (entry.author) {
                html += '<span>by ' + entry.author + '</span>';
              }
              html += '</div>';
              html += '</div>';
              html += '</div>';
            }
          }
        }
        html += '</div>';
        html += '</section>';
      }
      html += '</div>';

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
