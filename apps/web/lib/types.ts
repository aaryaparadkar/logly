export type ChangeType =
  | "feature"
  | "fix"
  | "improvement"
  | "breaking"
  | "docs"
  | "chore";

export interface ChangeEntry {
  id: string;
  type: ChangeType;
  title: string;
  description?: string;
  commitHash: string;
  author: string;
  date: string;
}

export interface Version {
  id: string;
  version: string;
  date: string;
  entries: ChangeEntry[];
}

export interface Changelog {
  owner: string;
  repo: string;
  name: string;
  logoUrl?: string;
  lastUpdated: string;
  versions: Version[];
}

export const changeTypeConfig: Record<
  ChangeType,
  { label: string; className: string }
> = {
  feature: {
    label: "Feature",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  fix: {
    label: "Fix",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  improvement: {
    label: "Improvement",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  breaking: {
    label: "Breaking",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  docs: {
    label: "Docs",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  chore: {
    label: "Chore",
    className: "bg-stone-50 text-stone-700 border-stone-200",
  },
};
