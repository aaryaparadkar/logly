"use client";

import { useState } from "react";
import {
  type ChangeEntry as ChangeEntryType,
  changeTypeConfig,
  type ChangeType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  GitCommit,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableEntryProps {
  entry: ChangeEntryType;
  onUpdate: (entry: ChangeEntryType) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

export function EditableEntry({
  entry,
  onUpdate,
  onDelete,
  onRegenerate,
}: EditableEntryProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const config = changeTypeConfig[entry.type];

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Simulate AI regeneration
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onRegenerate(entry.id);
    setIsRegenerating(false);
  };

  return (
    <div className="group relative py-6 first:pt-0 last:pb-0">
      {/* Drag handle - visual only for now */}
      <div className="absolute -left-8 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>

      <div className="space-y-4">
        {/* Type selector and actions row */}
        <div className="flex items-center justify-between gap-3">
          <Select
            value={entry.type}
            onValueChange={(value: ChangeType) =>
              onUpdate({ ...entry, type: value })
            }
          >
            <SelectTrigger className="w-[140px] h-9 border-border/80">
              <SelectValue>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
                    config.className,
                  )}
                >
                  {config.label}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(changeTypeConfig).map(
                ([type, { label, className }]) => (
                  <SelectItem key={type} value={type}>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
                        className,
                      )}
                    >
                      {label}
                    </span>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1.5"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  <span className="text-xs">Regenerating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs">Regenerate</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title input */}
        <div>
          <Input
            value={entry.title}
            onChange={(e) => onUpdate({ ...entry, title: e.target.value })}
            placeholder="What changed?"
            className="text-[15px] font-medium h-11 border-border/80 bg-card focus:bg-background transition-colors"
          />
        </div>

        {/* Description textarea */}
        <div>
          <Textarea
            value={entry.description || ""}
            onChange={(e) =>
              onUpdate({ ...entry, description: e.target.value })
            }
            placeholder="Add more context about this change (optional)"
            className="text-sm resize-none min-h-[80px] border-border/80 bg-card focus:bg-background transition-colors leading-relaxed"
            rows={3}
          />
        </div>

        {/* Commit info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
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
