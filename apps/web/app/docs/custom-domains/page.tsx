import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Github, Globe, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Custom Domains & Export - Logly",
  description:
    "Learn how to host your changelog on your own domain using Logly's export feature.",
};

export default function CustomDomainsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Logly
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Custom Domains & Export
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Host your changelog anywhere using Logly&apos;s export feature.
            </p>
          </div>

          <hr className="border-border/60" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Export Formats</h2>
            <p className="text-muted-foreground">
              Logly provides three export formats to suit different hosting needs:
            </p>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Dynamic Export (Recommended)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A self-contained HTML page that fetches live data from the API on each
                    load and auto-refreshes every 5 minutes. Perfect for
                    self-hosting - just set up a redirect or proxy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Static HTML</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A fixed snapshot of your changelog at export time. Host anywhere
                    static files are supported.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">JSON</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Raw changelog data for programmatic use or custom integrations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Hosting Options</h2>
            <p className="text-muted-foreground">
              Upload the exported files to any static hosting provider. Here are
              some popular options:
            </p>

            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Pages
                </h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Create a new repository: username.github.io</li>
                  <li>Add exported files to a docs/ folder</li>
                  <li>Push to GitHub and enable Pages in settings</li>
                  <li>
                    Your changelog is live at: https://username.github.io/repo/
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Cloudflare Pages
                </h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Go to Cloudflare Dashboard → Workers & Pages</li>
                  <li>Create a new Pages project</li>
                  <li>Connect to your GitHub repository</li>
                  <li>
                    Set build command (leave empty for static) and output directory
                  </li>
                  <li>Deploy and add custom domain in settings</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Other Static Hosts</h3>
                <p className="text-sm text-muted-foreground">
                  Netlify, Vercel, AWS S3 + CloudFront, Google Cloud Storage, or any
                  static file server works.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border/60" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Why Not Custom Domains?</h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm text-amber-800">
                Currently, Logly doesn&apos;t support direct custom domain pointing
                (like changelog.yourdomain.com) because Vercel requires each domain to
                be manually attached to the project.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                The export feature bypasses this limitation - export once and host anywhere!
              </p>
            </div>
          </section>

          <hr className="border-border/60" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Get Started</h2>
            <p className="text-muted-foreground">
              Go to your repository settings page and click &quot;Export&quot; to download your
              changelog in your preferred format.
            </p>
            <div className="flex gap-3">
              <Link href="/r/facebook/react">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Example
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">
            Generated with{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-foreground">
              logly
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}