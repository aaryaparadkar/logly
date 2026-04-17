"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Github,
  ChevronDown,
  Sparkles,
  GitCommit,
  FileText,
  Zap,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsLoading(true);

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");
      router.push(`/r/${owner}/${cleanRepo}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8 rounded-lg shadow-sm" />
            <span className="font-semibold text-foreground tracking-tight">
              logly
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://github.com/aaryaparadkar/logly"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              Star on GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6">
        <div className="py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-sm mb-8 border border-border/50">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-muted-foreground">v1.0 is live</span>
              <span className="text-border">|</span>
              <span className="font-medium">Open-source forever</span>
            </div>

            <h1 className="text-4xl md:text-[3.25rem] font-semibold tracking-tight text-foreground text-balance leading-[1.15]">
              Turn commits into
              <br />
              <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text">
                beautiful changelogs
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto text-pretty">
              Stop writing changelogs manually. Paste your repo URL, let AI do
              the heavy lifting, then edit and ship.
            </p>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-10">
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-foreground">
                    <Github className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  </div>
                  <Input
                    type="url"
                    placeholder="github.com/vercel/next.js"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="h-13 pl-11 pr-4 text-base bg-card border-border/80 shadow-sm focus:shadow-md transition-shadow"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start ml-1"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${showToken ? "rotate-180" : ""}`}
                  />
                  <span>Using a private repo?</span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${showToken ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <Input
                    type="password"
                    placeholder="GitHub personal access token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-12 text-base bg-card border-border/80 font-mono text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!repoUrl.trim() || isLoading}
                  className="h-13 text-base font-medium mt-1 shadow-sm hover:shadow-md transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Analyzing commits...
                    </span>
                  ) : (
                    <>
                      Generate changelog
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Quick examples */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Try:</span>
              <button
                onClick={() => setRepoUrl("https://github.com/vercel/next.js")}
                className="text-foreground hover:underline underline-offset-2"
              >
                vercel/next.js
              </button>
              <span className="text-border">·</span>
              <button
                onClick={() => setRepoUrl("https://github.com/shadcn/ui")}
                className="text-foreground hover:underline underline-offset-2"
              >
                shadcn/ui
              </button>
              <span className="text-border">·</span>
              <button
                onClick={() =>
                  setRepoUrl("https://github.com/tailwindlabs/tailwindcss")
                }
                className="text-foreground hover:underline underline-offset-2"
              >
                tailwindcss
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="border-t border-border/60 py-20">
          <div className="text-center mb-14">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              How it works
            </h2>
            <p className="text-2xl font-medium text-foreground">
              Three steps. Zero headaches.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-foreground">
                  1
                </span>
                <h3 className="font-medium text-foreground">Paste your repo</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drop in any GitHub URL. Public or private, we handle both. No
                complex setup required.
              </p>
            </div>

            <div className="group relative p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-foreground">
                  2
                </span>
                <h3 className="font-medium text-foreground">AI categorizes</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI reads your commits, understands context, and groups
                changes into features, fixes, and more.
              </p>
            </div>

            <div className="group relative p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-medium text-foreground">
                  3
                </span>
                <h3 className="font-medium text-foreground">Edit and ship</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fine-tune the wording, regenerate entries, then export or host
                on your own domain.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t border-border/60 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-medium text-foreground mb-4">
                Built for developers who ship fast
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether you&apos;re maintaining an open-source library or
                shipping product updates, logly helps you communicate changes
                clearly.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Smart categorization
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Features, fixes, breaking changes - all sorted
                      automatically
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <GitCommit className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Commit-aware
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Links back to commits and authors for full traceability
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Instant regeneration
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Don&apos;t like the wording? Regenerate any entry with one
                      click
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Preview card */}
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border/60 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Github className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        acme/dashboard
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Updated today
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-secondary text-foreground">
                      v2.4.0
                    </span>
                    <span className="text-xs text-muted-foreground">
                      April 12, 2026
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0 mt-0.5">
                        feature
                      </span>
                      <p className="text-sm text-foreground">
                        Added dark mode support with system preference detection
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 mt-0.5">
                        fix
                      </span>
                      <p className="text-sm text-foreground">
                        Fixed date picker timezone issue in reports
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-50 text-purple-700 border border-purple-100 shrink-0 mt-0.5">
                        improvement
                      </span>
                      <p className="text-sm text-foreground">
                        Improved table loading states with skeleton UI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 -top-4 -right-4 h-24 w-24 bg-secondary/50 rounded-full blur-2xl" />
              <div className="absolute -z-10 -bottom-4 -left-4 h-32 w-32 bg-secondary/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-border/60 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-foreground mb-3">
              Ready to automate your changelogs?
            </h2>
            <p className="text-muted-foreground mb-8">
              It takes 30 seconds. Seriously.
            </p>
            <Button
              size="lg"
              className="h-12 px-6"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Get started
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 rounded-md" />
              <span className="text-sm font-medium text-foreground">logly</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Open-source and free forever
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://github.com/aaryaparadkar/logly"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
