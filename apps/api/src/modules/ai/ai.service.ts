import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { GithubCommit } from "../github/github.service";

export type ChangeType =
  | "feature"
  | "fix"
  | "improvement"
  | "breaking"
  | "docs"
  | "chore";

export interface ChangeEntry {
  id: string;
  type: ChangeType;
  title: string;
  description?: string;
  commitHash: string;
  author: string;
  date: string;
}

export interface CategorizedCommit {
  type: ChangeType;
  title: string;
  description: string;
  commit: GithubCommit;
}

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("MISTRAL_API_KEY") || "";
    this.model =
      this.configService.get<string>("AI_MODEL") || "mistral-small-latest";
  }

  private generatePrompt(commits: GithubCommit[]): string {
    const commitList = commits
      .map(
        (c, i) =>
          `${i + 1}. ${c.sha.slice(0, 7)} - ${(c.commit?.message || "").split("\n")[0]}`,
      )
      .join("\n");

    return `You are a changelog generator. Analyze these Git commits and categorize them.

Categories:
- feature: New features or functionality
- fix: Bug fixes
- improvement: Enhancements or optimizations
- breaking: Breaking changes
- docs: Documentation changes
- chore: Maintenance, refactoring, tooling

For each commit, respond with EXACTLY ONE LINE in this format:
TYPE: sha - title (first 80 chars)

Rules:
1. Be concise - titles under 80 characters
2. Start with the category in uppercase (FEATURE, FIX, IMPROVEMENT, BREAKING, DOCS, CHORE)
3. Focus on "what changed" not "how"
4. Ignore merge commits and dependency updates

Commits:
${commitList}`;
  }

  async categorizeCommits(
    commits: GithubCommit[],
  ): Promise<CategorizedCommit[]> {
    if (!this.apiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    const prompt = this.generatePrompt(commits);

    try {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: this.model,
          messages: [
            { role: "system", content: "You are a code changelog expert." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      const content = response.data.choices[0]?.message?.content || "";
      return this.parseResponse(content, commits);
    } catch (error) {
      console.error("Mistral API error:", error);
      throw new Error("Failed to categorize commits");
    }
  }

  private parseResponse(
    response: string,
    commits: GithubCommit[],
  ): CategorizedCommit[] {
    const lines = response.split("\n").filter((line) => line.trim());
    const results: CategorizedCommit[] = [];

    const commitMap = new Map(commits.map((c) => [c.sha.slice(0, 7), c]));

    for (const line of lines) {
      const match = line.match(
        /^(FEATURE|FIX|IMPROVEMENT|BREAKING|DOCS|CHORE):\s*(\S+)\s*-\s*(.+)$/i,
      );
      if (match && match[1] && match[2] && match[3]) {
        const typeStr = match[1];
        const shortSha = match[2];
        const title = match[3];
        const type = this.mapType(typeStr.toLowerCase());
        const commit = commitMap.get(shortSha) || commits[0];

        if (commit) {
          results.push({
            type,
            title: title.trim().slice(0, 80),
            description: (commit.commit?.message || "").split("\n")[0] || "",
            commit,
          });
        }
      }
    }

    // If AI parsing failed, return basic mapping
    if (results.length === 0) {
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

        const msgLine = (
          (commit.commit?.message || "").split("\n")[0] || ""
        ).trim();
        return {
          type,
          title: msgLine.slice(0, 80),
          description: msgLine,
          commit,
        };
      });
    }

    return results;
  }

  private mapType(type: string): ChangeType {
    const map: Record<string, ChangeType> = {
      feature: "feature",
      fix: "fix",
      improvement: "improvement",
      breaking: "breaking",
      docs: "docs",
      chore: "chore",
    };
    return map[type] || "chore";
  }

  async regenerateEntry(
    currentTitle: string,
    currentDescription: string,
    type: ChangeType,
    commitMessage?: string,
  ): Promise<{ title: string; description: string }> {
    if (!this.apiKey) {
      return { title: currentTitle, description: currentDescription };
    }

    const exampleText =
      "Added dark mode support|Implemented system theme detection";
    const prompt = `Regenerate this changelog entry to be more concise and clear.

Current entry:
- Type: ${type}
- Title: ${currentTitle}
- Description: ${currentDescription}
${commitMessage ? `- Original commit: ${commitMessage}` : ""}

Respond with ONLY the new title (first line) and description (second line), separated by a pipe character.
Example: ${exampleText}

New entry:`;

    try {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a changelog writing expert. Be concise and clear.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 200,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      const content = response.data.choices[0]?.message?.content || "";
      const [title, description] = content
        .split("|")
        .map((s: string) => s.trim());

      return {
        title: title || currentTitle,
        description: description || currentDescription,
      };
    } catch (error) {
      console.error("Mistral regeneration error:", error);
      return { title: currentTitle, description: currentDescription };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
