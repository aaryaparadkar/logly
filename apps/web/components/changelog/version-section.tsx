import type { Version } from "@/lib/types";
import { ChangeEntry } from "./change-entry";
import { Tag, Calendar, Hash } from "lucide-react";

interface VersionSectionProps {
  version: Version;
}

export function VersionSection({ version }: VersionSectionProps) {
  const formattedDate = new Date(version.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Count by type
  const typeCounts = version.entries.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <section className="relative">
      {/* Version header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg shadow-sm">
            <Tag className="h-3.5 w-3.5" />
            <span className="text-sm font-semibold tracking-tight">
              {version.version}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
        </div>

        {/* Type summary */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3 w-3" />
            <span>{version.entries.length} changes</span>
          </div>
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              {count} {type}
              {count !== 1 ? "s" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="relative pl-4 border-l-2 border-border/60">
        <div className="divide-y divide-border/40">
          {version.entries.map((entry) => (
            <ChangeEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </section>
  );
}
