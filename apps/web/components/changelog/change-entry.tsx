import {
  type ChangeEntry as ChangeEntryType,
  changeTypeConfig,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { GitCommit, ExternalLink } from "lucide-react";

interface ChangeEntryProps {
  entry: ChangeEntryType;
}

export function ChangeEntry({ entry }: ChangeEntryProps) {
  const config = changeTypeConfig[entry.type];

  return (
    <div className="group py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        {/* Type indicator line */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border shrink-0",
              config.className,
            )}
          >
            {config.label}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-medium text-foreground leading-snug">
            {entry.title}
          </h4>
          {entry.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {entry.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <a
              href={`https://github.com/owner/repo/commit/${entry.commitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/link"
            >
              <GitCommit className="h-3 w-3" />
              <code className="font-mono">{entry.commitHash}</code>
              <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
            <span className="text-xs text-muted-foreground">
              by{" "}
              <span className="font-medium text-foreground/80">
                {entry.author}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
