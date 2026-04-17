import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy - logly",
  description: "Privacy policy for logly - AI-Powered Changelog Generator",
};

export default function PrivacyPage() {
  const lastUpdated = "April 12, 2026";

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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="/privacy"
              className="text-sm text-foreground font-medium transition-colors"
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

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {lastUpdated}
          </p>

          <section className="mb-8">
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy describes how logly (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
              your information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border/60 bg-card">
                <h3 className="font-medium text-foreground mb-2">
                  GitHub Repository Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  When you generate a changelog, we fetch commit history, commit
                  messages, and author information from GitHub. This data is
                  processed to generate your changelog and is not stored on our
                  servers.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/60 bg-card">
                <h3 className="font-medium text-foreground mb-2">
                  Personal Access Tokens
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you use a private repository, you may provide a GitHub
                  personal access token. This token is used solely to access the
                  GitHub API on your behalf and is
                  <strong className="text-foreground"> never stored </strong> on
                  our servers. It remains in your browser&apos;s local storage
                  and is only sent directly to GitHub&apos;s API.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/60 bg-card">
                <h3 className="font-medium text-foreground mb-2">Usage Data</h3>
                <p className="text-sm text-muted-foreground">
                  We collect anonymized usage data to improve our service. This
                  includes basic metrics like pages visited and features used,
                  but never includes personal information or your repository
                  data.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              How We Use Your Information
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>To generate changelogs from your GitHub repository</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>To improve and optimize our service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>To respond to your questions and support requests</span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Data Storage & Security
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We are committed to protecting your data:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Repository data is processed in memory and not persisted
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Personal access tokens are never stored on our servers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>We use industry-standard security measures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>All data transfers are encrypted</span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the following third-party services:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 font-medium text-foreground">
                      Service
                    </th>
                    <th className="text-left py-3 font-medium text-foreground">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <td className="py-3">GitHub API</td>
                    <td className="py-3">Fetch repository commits</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="py-3">Vercel</td>
                    <td className="py-3">Hosting and analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the following rights regarding your data:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Access:</strong> You can
                  view all data we process
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Deletion:</strong> Request
                  deletion of any stored data
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  <strong className="text-foreground">Opt-out:</strong> Disable
                  analytics via browser settings
                </span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for children under 13. We do not
              knowingly collect personal information from children under 13. If
              you believe we have collected information from a child under 13,
              please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page.
              You are advised to review this Privacy Policy periodically for any
              changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us through our GitHub repository or email.
            </p>
          </section>
        </article>
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
