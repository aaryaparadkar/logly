"use client";

import type { Version, ChangeEntry } from "@/lib/types";
import { EditableEntry } from "./editable-entry";
import {
  Tag,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EditableVersionProps {
  version: Version;
  onUpdate: (version: Version) => void;
}

export function EditableVersion({ version, onUpdate }: EditableVersionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleEntryUpdate = (updatedEntry: ChangeEntry) => {
    onUpdate({
      ...version,
      entries: version.entries.map((e) =>
        e.id === updatedEntry.id ? updatedEntry : e,
      ),
    });
  };

  const handleEntryDelete = (id: string) => {
    onUpdate({
      ...version,
      entries: version.entries.filter((e) => e.id !== id),
    });
  };

  const handleEntryRegenerate = (id: string) => {
    // In a real app, this would call the AI to regenerate
    const entry = version.entries.find((e) => e.id === id);
    if (entry) {
      onUpdate({
        ...version,
        entries: version.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                description:
                  "AI regenerated description with more context about the change.",
              }
            : e,
        ),
      });
    }
  };

  const handleAddEntry = () => {
    const newEntry: ChangeEntry = {
      id: `new-${Date.now()}`,
      type: "feature",
      title: "",
      description: "",
      commitHash: "0000000",
      author: "you",
    };
    onUpdate({
      ...version,
      entries: [...version.entries, newEntry],
    });
  };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-foreground text-background rounded-xl shadow-sm">
              <Tag className="h-3.5 w-3.5" />
              <Input
                value={version.version}
                onChange={(e) =>
                  onUpdate({ ...version, version: e.target.value })
                }
                className="h-5 w-20 px-1 py-0 text-sm font-semibold tracking-tight border-0 bg-transparent text-background placeholder:text-background/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="v1.0.0"
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <Input
                type="date"
                value={version.date}
                onChange={(e) => onUpdate({ ...version, date: e.target.value })}
                className="h-8 w-[130px] text-sm text-muted-foreground border-border/60 bg-card"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            )}
          </Button>
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
      {!isCollapsed && (
        <>
          <div className="relative pl-6 border-l-2 border-border/60">
            <div className="divide-y divide-border/40">
              {version.entries.map((entry) => (
                <EditableEntry
                  key={entry.id}
                  entry={entry}
                  onUpdate={handleEntryUpdate}
                  onDelete={handleEntryDelete}
                  onRegenerate={handleEntryRegenerate}
                />
              ))}
            </div>
          </div>

          {/* Add entry button */}
          <div className="mt-6 pl-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEntry}
              className="border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add entry
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
