"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { EditableVersion } from "@/components/changelog/editable-version";
import { updateChangelog, fetchChangelog } from "@/lib/api";
import type { Version, Changelog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Save,
  Download,
  ArrowLeft,
  FileJson,
  FileText,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default function EditPage({ params }: PageProps) {
  const { owner, repo } = use(params);

  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(`github_token_${owner}/${repo}`);
    if (storedToken) {
      setToken(storedToken);
    }
  }, [owner, repo]);

  const verifyTokenAndLoad = async (githubToken: string) => {
    setIsVerifying(true);
    setTokenError(null);
    try {
      const data = await fetchChangelog(owner, repo, githubToken);
      localStorage.setItem(`github_token_${owner}/${repo}`, githubToken);
      setChangelog({
        owner: data.owner,
        repo: data.repo,
        name: data.data.name,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        versions: data.data.versions.map((v: any) => ({
          id: v.id,
          version: v.version,
          date: v.date,
          entries: v.entries.map((e: any) => ({
            id: e.id,
            type: e.type,
            title: e.title,
            description: e.description,
            commitHash: e.commitHash,
            author: e.author,
            date: e.date,
          })),
        })),
      });
    } catch (e: any) {
      setTokenError(
        e.message ||
          "Failed to verify token. Make sure you have write access to this repository.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyTokenAndLoad(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const initialChangelog = changelog;

  const handleVersionUpdate = (updatedVersion: Version) => {
    if (!changelog) return;
    setChangelog({
      ...changelog,
      versions: changelog.versions.map((v) =>
        v.id === updatedVersion.id ? updatedVersion : v,
      ),
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!changelog || !token) return;
    setIsSaving(true);
    try {
      await updateChangelog(
        owner,
        repo,
        {
          name: changelog.name,
          versions: changelog.versions,
        },
        token,
      );
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error("Failed to save:", e);
      alert(
        e.message ||
          "Failed to save changes. Your token may have expired or lost access.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (initialChangelog) {
      setChangelog(initialChangelog);
      setHasChanges(false);
    }
  };

  const handleTokenSubmit = async () => {
    if (token.trim()) {
      await verifyTokenAndLoad(token.trim());
    }
  };

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-6 w-6 border-2 border-border/30 border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">
            {isVerifying ? "Verifying access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!token && !changelog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Edit Access Required
            </h1>
            <p className="text-muted-foreground">
              To edit this changelog, you need a GitHub Personal Access Token
              with write access to the repository.
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {tokenError && <p className="text-sm text-red-500">{tokenError}</p>}
            <button
              onClick={handleTokenSubmit}
              disabled={!token.trim()}
              className="w-full py-3 px-4 rounded-lg bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Continue
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Create a token
            </a>{" "}
            with "repo" scope for private repos or public repos.
          </p>
        </div>
      </div>
    );
  }

  const handleExportMarkdown = () => {
    if (!changelog) return;
    let md = `# ${changelog.name} Changelog\n\n`;
    md += `> Generated by [logly](https://logly.app)\n\n`;
    changelog.versions.forEach((version) => {
      md += `## ${version.version} (${version.date})\n\n`;
      version.entries.forEach((entry) => {
        md += `- **${entry.type}**: ${entry.title}\n`;
        if (entry.description) {
          md += `  ${entry.description}\n`;
        }
      });
      md += "\n";
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CHANGELOG.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(changelog, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "changelog.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Editor Header */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/r/${owner}/${repo}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {owner}/{repo}
                </span>
                {hasChanges && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Unsaved
                  </span>
                )}
                {saveSuccess && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  <Undo2 className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              )}

              <Link href={`/r/${owner}/${repo}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/80"
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Preview
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80"
                    disabled={isLoading || !changelog}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                    <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  <DropdownMenuItem
                    onClick={handleExportMarkdown}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Markdown</p>
                      <p className="text-xs text-muted-foreground">
                        CHANGELOG.md
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportJSON}
                    className="gap-2"
                  >
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">
                        changelog.json
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Tips */}
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/40">
          <Sparkles className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Editing mode</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click on any text to edit. Use the regenerate button to get a new
              AI-generated description for any entry.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-border/30 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Link href={`/r/${owner}/${repo}`}>
              <Button variant="outline" size="sm" className="mt-4">
                Go back
              </Button>
            </Link>
          </div>
        ) : changelog?.versions.length ? (
          <div className="space-y-16">
            {changelog.versions.map((version) => (
              <EditableVersion
                key={version.id}
                version={version}
                onUpdate={handleVersionUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
            <p className="text-muted-foreground">No entries to edit</p>
          </div>
        )}
      </main>

      {/* Floating save bar when there are changes */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-foreground text-background rounded-full shadow-lg">
            <span className="text-sm">You have unsaved changes</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 px-3 text-xs bg-background text-foreground hover:bg-background/90"
            >
              {isSaving ? "Saving..." : "Save now"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
