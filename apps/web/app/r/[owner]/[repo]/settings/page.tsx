"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Key,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-base-url";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

const DEFAULT_BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "logly.app";

export default function SettingsPage({ params }: PageProps) {
  const { owner, repo } = use(params);

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savedToken, setSavedToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const tokenStorageKey = `github_token_${owner}/${repo}`;
  const maskedToken = savedToken
    ? `${savedToken.slice(0, 4)}_${"•".repeat(Math.max(savedToken.length - 8, 12))}${savedToken.slice(-4)}`
    : "";

  useEffect(() => {
    const storedToken = localStorage.getItem(tokenStorageKey) || "";
    setSavedToken(storedToken);
    setHasToken(Boolean(storedToken));
  }, [tokenStorageKey]);

  const handleSaveToken = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    setIsSavingToken(true);

    try {
      localStorage.setItem(tokenStorageKey, trimmedToken);

      setHasToken(true);
      setSavedToken(trimmedToken);
      setToken("");
      toast.success("Token saved securely");
    } catch {
      toast.error("Failed to save token");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleDeleteToken = async () => {
    localStorage.removeItem(tokenStorageKey);
    setSavedToken("");
    setHasToken(false);
    toast.success("Token removed");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/r/${owner}/${repo}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to changelog
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* GitHub Token Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <Key className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  GitHub Token
                </h2>
                <p className="text-xs text-muted-foreground">
                  Required for private repositories
                </p>
              </div>
            </div>

            {hasToken ? (
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Token configured
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {maskedToken}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteToken}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-11 pr-10 bg-card border-border/80 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveToken}
                      disabled={!token.trim() || isSavingToken}
                    >
                      {isSavingToken ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Token"
                      )}
                    </Button>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      Create a token
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>

          <hr className="border-border/60" />

          {/* Export Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <Download className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  Export Changelog
                </h2>
                <p className="text-xs text-muted-foreground">
                  Download your changelog to host anywhere
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your changelog to host anywhere. Use <strong>dynamic</strong> for auto-updating deployments.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${API_BASE_URL}/export/${owner}/${repo}/dynamic`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" />
                    Dynamic (Auto-Update)
                  </Button>
                </a>
                <a
                  href={`${API_BASE_URL}/export/${owner}/${repo}/html`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    Static HTML
                  </Button>
                </a>
                <a
                  href={`${API_BASE_URL}/export/${owner}/${repo}/json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    JSON
                  </Button>
                </a>
              </div>

              <div className="rounded-lg bg-amber-50 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800">Dynamic Export</p>
                <p className="text-xs text-amber-700">
                  The dynamic export fetches live data from the API each time it loads, and auto-refreshes every 5 minutes.
                  Perfect for self-hosted deployments - just set up a redirect or proxy to point to this URL.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Need help hosting? Check the <Link href="/docs/custom-domains" className="underline hover:text-foreground">docs</Link> for instructions.
              </p>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* Danger Zone */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  Danger Zone
                </h2>
                <p className="text-xs text-muted-foreground">
                  Irreversible actions
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Delete this changelog
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This will permanently delete all versions and entries
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}