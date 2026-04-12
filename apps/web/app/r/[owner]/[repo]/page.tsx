import { ChangelogHeader } from "@/components/changelog/changelog-header";
import { VersionSection } from "@/components/changelog/version-section";
import { getMockChangelog } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default async function ChangelogPage({ params }: PageProps) {
  const { owner, repo } = await params;
  const changelog = getMockChangelog(owner, repo);

  return (
    <div className="min-h-screen bg-background">
      <ChangelogHeader
        owner={changelog.owner}
        repo={changelog.repo}
        name={changelog.name}
        lastUpdated={changelog.lastUpdated}
      />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-12">
          {changelog.versions.map((version) => (
            <VersionSection key={version.id} version={version} />
          ))}
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <p className="text-xs text-muted-foreground text-center">
            Generated with{" "}
            <a
              href="/"
              className="underline underline-offset-2 hover:text-foreground"
            >
              logly
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
