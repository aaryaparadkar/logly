export type ChangeType =
  | "feature"
  | "fix"
  | "improvement"
  | "breaking"
  | "docs"
  | "chore";

export interface CreateChangelogDto {
  owner: string;
  repo: string;
  token?: string;
  limit?: number;
}

export interface UpdateChangelogDto {
  data?: ChangelogDataDto;
  token?: string;
}

export interface ChangeEntryDto {
  id?: string;
  type: ChangeType;
  title: string;
  description?: string;
  commitHash: string;
  author: string;
  date: string;
}

export interface VersionDto {
  id?: string;
  version: string;
  date: string;
  entries: ChangeEntryDto[];
}

export interface ChangelogDataDto {
  name: string;
  logoUrl?: string;
  versions: VersionDto[];
}

export interface GenerateChangelogResponse {
  owner: string;
  repo: string;
  data: ChangelogDataDto;
  stats: {
    versions: number;
    changes: number;
    contributors: number;
  };
}
