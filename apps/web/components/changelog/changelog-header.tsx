import {
  Github,
  Settings,
  Edit3,
  FileText,
  ExternalLink,
  Rss,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChangelogHeaderProps {
  owner: string;
  repo: string;
  name: string;
  lastUpdated: string;
  showEditButton?: boolean;
  stats?: {
    versions: number;
    changes: number;
    contributors: number;
  };
}

export function ChangelogHeader({
  owner,
  repo,
  name,
  lastUpdated,
  showEditButton = true,
  stats,
}: ChangelogHeaderProps) {
  const formattedDate = new Date(lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate relative time
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffDays = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
  );
  const relativeTime =
    diffDays === 0
      ? "today"
      : diffDays === 1
        ? "yesterday"
        : `${diffDays} days ago`;

  return (
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
              <FileText className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold text-foreground tracking-tight group-hover:opacity-80 transition-opacity">
              logly
            </span>
          </Link>

          {showEditButton && (
            <div className="flex items-center gap-1">
              <Link href={`/r/${owner}/${repo}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit3 className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Link href={`/r/${owner}/${repo}/settings`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 pb-12">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shrink-0 border border-border/40 shadow-sm">
            <Github className="h-8 w-8 text-foreground" />
          </div>
          <div className="min-w-0 pt-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <a
                href={`https://github.com/${owner}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {owner}/{repo}
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-border">·</span>
              <span className="text-sm text-muted-foreground">
                Updated {relativeTime}
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <a
                href={`https://github.com/${owner}/${repo}/commits/main.atom`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Rss className="h-3 w-3" />
                Subscribe
              </a>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border/40">
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">
              {stats?.versions || "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Versions</p>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">
              {stats?.changes || "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Changes</p>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">
              {stats?.contributors || "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Contributors</p>
          </div>
        </div>
      </div>
    </header>
  );
}
