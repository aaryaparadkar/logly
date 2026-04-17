import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Docs - logly",
  description:
    "Learn how to use logly to generate beautiful changelogs from your GitHub commits.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-foreground tracking-tight">
                logly
              </span>
            </a>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-sm text-foreground font-medium transition-colors"
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
              Star on GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid md:grid-cols-[220px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="md:sticky md:top-24 md:h-fit">
            <nav className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Getting Started
              </p>
              <a
                href="#introduction"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Introduction
              </a>
              <a
                href="#quick-start"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Quick Start
              </a>
              <a
                href="#authentication"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Authentication
              </a>

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-6">
                Features
              </p>
              <a
                href="#categorization"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Smart Categorization
              </a>
              <a
                href="#regeneration"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Regeneration
              </a>
              <a
                href="#export"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Export Options
              </a>

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-6">
                API
              </p>
              <a
                href="#api-reference"
                className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Reference
              </a>
            </nav>
          </aside>

          {/* Content */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <section id="introduction" className="mb-12">
              <h1 className="text-3xl font-semibold text-foreground mb-4">
                Introduction
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-4">
                logly is an AI-powered tool that transforms your GitHub commits
                into beautiful, organized changelogs. Built for developers who
                ship fast and want to communicate changes clearly.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you&apos;re maintaining an open-source library or
                shipping product updates, logly helps you generate professional
                changelogs in seconds, not hours.
              </p>
            </section>

            <section id="quick-start" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Quick Start
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Generating a changelog takes just a few seconds:
              </p>

              <ol className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-foreground font-medium">
                      Paste your repository URL
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter any public GitHub repository URL in the input field.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-foreground font-medium">
                      AI analyzes your commits
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our AI reads through your commit history and intelligently
                      categorizes changes.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground shrink-0">
                    3
                  </span>
                  <div>
                    <p className="text-foreground font-medium">
                      Edit and export
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review the generated changelog, make adjustments, and
                      export in your preferred format.
                    </p>
                  </div>
                </li>
              </ol>
            </section>

            <section id="authentication" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Authentication
              </h2>

              <div className="p-4 rounded-lg border border-border/60 bg-card mb-6">
                <h3 className="font-medium text-foreground mb-2">
                  Public Repositories
                </h3>
                <p className="text-sm text-muted-foreground">
                  No authentication required. Just paste the URL and go.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border/60 bg-card mb-6">
                <h3 className="font-medium text-foreground mb-2">
                  Private Repositories
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  To generate changelogs for private repos, you&apos;ll need a
                  GitHub personal access token.
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Go to GitHub Settings &rarr; Developer settings &rarr;
                    Personal access tokens
                  </li>
                  <li>
                    Generate a new token (classic) with <code>repo</code> scope
                  </li>
                  <li>
                    Enter the token in the &quot;Using a private repo?&quot;
                    section
                  </li>
                </ol>
              </div>

              <p className="text-sm text-muted-foreground">
                Your token is stored locally in your browser and never sent to
                our servers. We only use it to fetch commit data from the GitHub
                API on your behalf.
              </p>
            </section>

            <section id="categorization" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Smart Categorization
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                logly automatically categorizes your commits into meaningful
                groups:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-100">
                    feature
                  </span>
                  <span className="text-sm text-muted-foreground">
                    New features and functionality
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    fix
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Bug fixes and corrections
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-100">
                    improvement
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Enhancements and optimizations
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-100">
                    breaking
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Breaking changes
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-100">
                    docs
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Documentation updates
                  </span>
                </div>
              </div>
            </section>

            <section id="regeneration" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Regeneration
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Not happy with how a specific entry was phrased? You can
                regenerate any changelog entry with a single click. Our AI will
                generate an alternative description while preserving the
                original meaning.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This gives you full control over the final output while still
                benefiting from AI-assisted drafting.
              </p>
            </section>

            <section id="export" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Export Options
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Once your changelog is ready, you can export it in multiple
                formats:
              </p>

              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Markdown - for GitHub releases, docs, and blogs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>HTML - for websites and emails</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>JSON - for programmatic access and integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground">•</span>
                  <span>Direct link - share a URL with your team</span>
                </li>
              </ul>
            </section>

            <section id="api-reference" className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                API Reference
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                logly is primarily a web-based tool, but we offer API access for
                integrations. Contact us for API documentation and access.
              </p>

              <div className="p-4 rounded-lg border border-border/60 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Self-hosting:</strong>{" "}
                  logly is open-source. You can run your own instance with the
                  GitHub repository. This gives you full control over your data
                  and enables custom integrations.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
                <FileText className="h-3 w-3 text-background" />
              </div>
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
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
