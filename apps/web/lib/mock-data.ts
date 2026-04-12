import type { Changelog } from "./types";

export function getMockChangelog(owner: string, repo: string): Changelog {
  return {
    owner,
    repo,
    name: repo.charAt(0).toUpperCase() + repo.slice(1).replace(/-/g, " "),
    lastUpdated: new Date().toISOString(),
    versions: [
      {
        id: "v1",
        version: "v2.1.0",
        date: "2026-04-10",
        entries: [
          {
            id: "e1",
            type: "feature",
            title: "Add dark mode support",
            description:
              "Users can now toggle between light and dark themes in settings.",
            commitHash: "a1b2c3d",
            author: "johndoe",
            date: "2026-04-10",
          },
          {
            id: "e2",
            type: "feature",
            title: "Implement real-time notifications",
            description:
              "Push notifications are now delivered instantly using WebSockets.",
            commitHash: "e4f5g6h",
            author: "janedoe",
            date: "2026-04-09",
          },
          {
            id: "e3",
            type: "fix",
            title: "Fix authentication timeout issue",
            description: "Resolved a bug where sessions expired prematurely.",
            commitHash: "i7j8k9l",
            author: "devuser",
            date: "2026-04-08",
          },
        ],
      },
      {
        id: "v2",
        version: "v2.0.0",
        date: "2026-04-01",
        entries: [
          {
            id: "e4",
            type: "breaking",
            title: "Migrate to new API structure",
            description:
              "API endpoints have been restructured. See migration guide.",
            commitHash: "m1n2o3p",
            author: "johndoe",
            date: "2026-04-01",
          },
          {
            id: "e5",
            type: "improvement",
            title: "Optimize database queries",
            description:
              "Reduced average query time by 40% through indexing improvements.",
            commitHash: "q4r5s6t",
            author: "janedoe",
            date: "2026-03-30",
          },
          {
            id: "e6",
            type: "docs",
            title: "Update API documentation",
            description: "Added comprehensive examples for all new endpoints.",
            commitHash: "u7v8w9x",
            author: "techwriter",
            date: "2026-03-29",
          },
        ],
      },
      {
        id: "v3",
        version: "v1.5.0",
        date: "2026-03-15",
        entries: [
          {
            id: "e7",
            type: "feature",
            title: "Add export to CSV functionality",
            description: "Users can now export their data in CSV format.",
            commitHash: "y1z2a3b",
            author: "devuser",
            date: "2026-03-15",
          },
          {
            id: "e8",
            type: "fix",
            title: "Resolve memory leak in dashboard",
            description:
              "Fixed an issue causing gradual memory increase over time.",
            commitHash: "c4d5e6f",
            author: "johndoe",
            date: "2026-03-14",
          },
          {
            id: "e9",
            type: "chore",
            title: "Update dependencies",
            description: "Bumped all packages to their latest stable versions.",
            commitHash: "g7h8i9j",
            author: "janedoe",
            date: "2026-03-13",
          },
        ],
      },
    ],
  };
}
