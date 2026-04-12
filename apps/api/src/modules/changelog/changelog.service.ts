import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
    private configService: ConfigService,
  ) {}

  async generateChangelog(dto: CreateChangelogDto) {
    const { owner, repo, token, limit = 100 } = dto;

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
    };
  }

  private fallbackCategorize(commits: GithubCommit[]): CategorizedCommit[] {
    return commits.map((commit) => {
      const msg = (commit.commit?.message || "").toLowerCase();
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
        title: ((commit.commit?.message || "").split("\n")[0] || "").slice(
          0,
          80,
        ),
        description: (commit.commit?.message || "").split("\n")[0] || "",
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

    // In a real implementation, this would save to the database
    // For now, we just return success
    return { success: true };
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
}
