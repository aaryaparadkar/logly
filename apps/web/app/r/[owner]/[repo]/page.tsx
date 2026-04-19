import { fetchChangelog } from "@/lib/api";
import { ChangelogHeader } from "@/components/changelog/changelog-header";
import { VersionSection } from "@/components/changelog/version-section";
import { Logo } from "@/components/logo";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default async function ChangelogPage({ params }: PageProps) {
  const { owner, repo } = await params;

  let changelog;
  let error = null;
  let data;

  try {
    data = await fetchChangelog(owner, repo);

    changelog = {
      owner: data.owner,
      repo: data.repo,
      name: data.data.name,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      defaultBranch: data.defaultBranch || "main",
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
    };
  } catch (e: any) {
    console.error("Failed to fetch changelog:", e);
    error = e.message;
    changelog = {
      owner,
      repo,
      name: repo,
      lastUpdated: new Date().toISOString(),
      versions: [],
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <ChangelogHeader
        owner={changelog.owner}
        repo={changelog.repo}
        name={changelog.name}
        lastUpdated={changelog.lastUpdated}
        error={error}
        stats={data?.stats}
        defaultBranch={changelog.defaultBranch}
      />

      <main className="mx-auto max-w-3xl px-6 py-10">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              Please check the repository name and try again.
            </p>
          </div>
        ) : changelog.versions.length > 0 ? (
          <div className="space-y-12">
            {changelog.versions.map((version: any) => (
              <VersionSection key={version.id} version={version} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-center">
            <p className="text-muted-foreground">
              No commits found for this repository.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex items-center justify-center gap-2">
            <Logo className="h-4 w-4 rounded-md" />
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
        </div>
      </footer>
    </div>
  );
}
