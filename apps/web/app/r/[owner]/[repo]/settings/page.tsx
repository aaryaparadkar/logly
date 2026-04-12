"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Key,
  Globe,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Shield,
  Copy,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function SettingsPage({ params }: PageProps) {
  const { owner, repo } = use(params);
  const router = useRouter();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [customDomain, setCustomDomain] = useState("");
  const [savedDomain, setSavedDomain] = useState("");
  const [cnameTarget, setCnameTarget] = useState("");
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveToken = async () => {
    if (!token.trim()) return;
    setIsSavingToken(true);

    try {
      const response = await fetch(`${API_URL}/settings/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Failed to save token");
      }

      setHasToken(true);
      setToken("");
      toast.success("Token saved securely");
    } catch (error) {
      toast.error("Failed to save token");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleRemoveToken = async () => {
    setIsSavingToken(true);

    try {
      const response = await fetch(`${API_URL}/settings/token`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove token");
      }

      setHasToken(false);
      toast.success("Token removed");
    } catch (error) {
      toast.error("Failed to remove token");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!customDomain.trim()) return;
    setIsSavingDomain(true);

    try {
      const response = await fetch(`${API_URL}/settings/domain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: customDomain }),
      });

      if (!response.ok) {
        throw new Error("Failed to save domain");
      }

      const data = await response.json();
      setSavedDomain(customDomain);
      setCnameTarget(data.cnameTarget);
      setDomainVerified(false);
      toast.success("Domain configured");
    } catch (error) {
      toast.error("Failed to save domain");
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!savedDomain) return;
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_URL}/settings/domain/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: savedDomain }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify domain");
      }

      const data = await response.json();
      setDomainVerified(data.verified);

      if (data.verified) {
        toast.success("Domain verified successfully");
      } else {
        toast.error("DNS verification failed. Please check your CNAME record.");
      }
    } catch (error) {
      toast.error("Failed to verify domain");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = () => {
    setSavedDomain("");
    setCustomDomain("");
    setCnameTarget("");
    setDomainVerified(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-2xl px-6 py-4">
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
              <span className="text-sm font-medium text-foreground">
                Settings
              </span>
            </div>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
                <FileText className="h-3.5 w-3.5 text-background" />
              </div>
              <span className="font-semibold text-foreground tracking-tight group-hover:opacity-80 transition-opacity">
                logly
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="space-y-10">
          {/* Repository Info */}
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              {owner}/{repo}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Configure your changelog settings, integrations, and custom
              domain.
            </p>
          </div>

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
                  Access private repos or increase rate limits
                </p>
              </div>
            </div>

            {hasToken ? (
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Token configured
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ghp_••••••••••••••••••••
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveToken}
                    disabled={isSavingToken}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isSavingToken ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1.5" />
                    )}
                    Remove
                  </Button>
                </div>
                <div className="px-4 py-3 bg-secondary/30 border-t border-border/40">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-emerald-600" />
                    Your token is encrypted and stored securely
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pr-10 font-mono text-sm h-11 bg-card border-border/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            )}
          </section>

          <hr className="border-border/60" />

          {/* Custom Domain Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <Globe className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  Custom Domain
                </h2>
                <p className="text-xs text-muted-foreground">
                  Host your changelog on your own domain
                </p>
              </div>
            </div>

            {savedDomain ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          domainVerified ? "bg-emerald-50" : "bg-amber-50"
                        }`}
                      >
                        {domainVerified ? (
                          <Check className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {savedDomain}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {domainVerified
                            ? "Verified and active"
                            : "Pending DNS verification"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {domainVerified ? (
                        <a
                          href={`https://${savedDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border/80"
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            Visit
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleVerifyDomain}
                          disabled={isVerifying}
                          className="border-border/80"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify DNS"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDomain}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {!domainVerified && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-amber-200/60 bg-amber-50">
                      <p className="text-sm font-medium text-amber-800">
                        DNS Configuration Required
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-amber-700">
                        Add the following CNAME record to your domain&apos;s DNS
                        settings:
                      </p>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <span className="font-medium">CNAME</span>
                            <span className="text-amber-400">|</span>
                            <span>Host: {savedDomain.split(".")[0]}</span>
                          </div>
                          <code className="text-sm font-mono text-amber-900">
                            {cnameTarget || "changelog.logly.app"}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              cnameTarget || "changelog.logly.app",
                            )
                          }
                          className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="changelog.yourdomain.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="h-11 bg-card border-border/80"
                />
                <Button
                  onClick={handleSaveDomain}
                  disabled={!customDomain.trim() || isSavingDomain}
                >
                  {isSavingDomain ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Domain"
                  )}
                </Button>
              </div>
            )}
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
