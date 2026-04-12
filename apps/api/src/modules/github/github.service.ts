import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

export interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  default_branch: string;
  pushed_at: string;
  language: string | null;
}

export interface GithubRepoPermissions {
  push: boolean;
  admin: boolean;
  maintain: boolean;
  triage: boolean;
  pull: boolean;
}

@Injectable()
export class GithubService {
  private readonly client: AxiosInstance;
  private readonly baseUrl = "https://api.github.com";

  constructor(private configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      const appToken = this.configService.get<string>("GITHUB_TOKEN");
      if (appToken) {
        headers["Authorization"] = `Bearer ${appToken}`;
      }
    }
    return headers;
  }

  async getRepo(
    owner: string,
    repo: string,
    token?: string,
  ): Promise<GithubRepo> {
    const response = await this.client.get<GithubRepo>(
      `/repos/${owner}/${repo}`,
      { headers: this.getHeaders(token) },
    );
    return response.data;
  }

  async getCommits(
    owner: string,
    repo: string,
    token?: string,
    options: {
      limit?: number;
      since?: string;
      until?: string;
    } = {},
  ): Promise<GithubCommit[]> {
    const { limit = 100, since, until } = options;

    const params: Record<string, string | number> = {
      per_page: Math.min(limit, 100),
    };
    if (since) params.since = since;
    if (until) params.until = until;

    const response = await this.client.get<GithubCommit[]>(
      `/repos/${owner}/${repo}/commits`,
      {
        headers: this.getHeaders(token),
        params,
      },
    );

    return response.data;
  }

  async getCommitsSince(
    owner: string,
    repo: string,
    sinceDate: string,
    token?: string,
  ): Promise<GithubCommit[]> {
    return this.getCommits(owner, repo, token, {
      since: sinceDate,
      limit: 200,
    });
  }

  async checkRepoAccess(
    owner: string,
    repo: string,
    token: string,
  ): Promise<GithubRepoPermissions> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`, {
        headers: this.getHeaders(token),
      });
      return (
        response.data.permissions || {
          push: false,
          admin: false,
          maintain: false,
          triage: false,
          pull: true,
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error("Repository not found or not accessible");
      }
      throw error;
    }
  }

  async verifyWriteAccess(
    owner: string,
    repo: string,
    token: string,
  ): Promise<boolean> {
    const permissions = await this.checkRepoAccess(owner, repo, token);
    return (
      permissions.push === true ||
      permissions.admin === true ||
      permissions.maintain === true
    );
  }

  async getTags(
    owner: string,
    repo: string,
    token?: string,
  ): Promise<{ name: string; commit: { sha: string } }[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/tags`, {
      headers: this.getHeaders(token),
      params: { per_page: 50 },
    });
    return response.data;
  }

  async getCompare(
    owner: string,
    repo: string,
    base: string,
    head: string,
    token?: string,
  ) {
    const response = await this.client.get(
      `/repos/${owner}/${repo}/compare/${base}...${head}`,
      { headers: this.getHeaders(token) },
    );
    return response.data;
  }
}
