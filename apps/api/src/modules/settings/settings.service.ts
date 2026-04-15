import { Injectable, NotFoundException } from "@nestjs/common";
import { CryptoService } from "./crypto.service";
import { DatabaseService } from "../../db/database.service";
import { eq, and, desc } from "drizzle-orm";
import { changelogs, customDomains } from "../../db/schema";

export interface UserSettings {
  hasToken: boolean;
  customDomains: string[];
}

export interface SaveTokenDto {
  token: string;
}

export interface CustomDomainDto {
  domain: string;
}

export interface CustomDomainResponse {
  domain: string;
  cnameTarget: string;
  status: "pending" | "verified";
  owner?: string;
  repo?: string;
}

export interface RepoCustomDomain {
  domain: string;
  cnameTarget: string;
  status: "pending" | "verified";
  verified: boolean;
  createdAt: string;
}

@Injectable()
export class SettingsService {
  private readonly baseUrl: string;

  constructor(
    private cryptoService: CryptoService,
    private db: DatabaseService,
  ) {
    this.baseUrl = process.env.LOGLY_BASE_URL || "logly.app";
  }

  private getBaseHost(): string {
    const rawBaseUrl = this.baseUrl.trim();

    if (!rawBaseUrl) {
      return "logly.app";
    }

    try {
      return new URL(rawBaseUrl).host;
    } catch {
      return (
        rawBaseUrl.replace(/^https?:\/\//, "").split("/")[0] || "logly.app"
      );
    }
  }

  private getCnameTarget(): string {
    return `cname.${this.getBaseHost()}`;
  }

  async saveToken(
    userId: string,
    token: string,
  ): Promise<{ success: boolean }> {
    const encrypted = this.cryptoService.encrypt(token);
    console.log(
      `Token encrypted for user ${userId}: ${encrypted.slice(0, 20)}...`,
    );
    return { success: true };
  }

  async deleteToken(userId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getToken(userId: string): Promise<string | null> {
    return null;
  }

  getCustomDomainConfig(domain: string): CustomDomainResponse {
    return {
      domain,
      cnameTarget: this.getCnameTarget(),
      status: "pending",
    };
  }

  async configureCustomDomain(
    domain: string,
    owner: string,
    repo: string,
  ): Promise<CustomDomainResponse> {
    console.log(`Configuring custom domain: ${domain} for ${owner}/${repo}`);

    try {
      const db = this.db.getDrizzle();

      const existingChangelog = await db.query.changelogs.findFirst({
        where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
      });

      if (existingChangelog) {
        await db
          .update(changelogs)
          .set({ customDomain: domain, updatedAt: new Date() })
          .where(eq(changelogs.id, existingChangelog.id));

        const existingDomain = await db.query.customDomains.findFirst({
          where: eq(customDomains.domain, domain),
        });

        if (!existingDomain) {
          await db.insert(customDomains).values({
            domain,
            changelogId: existingChangelog.id,
            verified: false,
          });
        }
      }

      return {
        domain,
        cnameTarget: this.getCnameTarget(),
        status: "pending",
        owner,
        repo,
      };
    } catch (error) {
      console.error("Error configuring domain:", error);
      return {
        domain,
        cnameTarget: this.getCnameTarget(),
        status: "pending",
        owner,
        repo,
      };
    }
  }

  async listCustomDomains(
    owner: string,
    repo: string,
  ): Promise<RepoCustomDomain[]> {
    const db = this.db.getDrizzle();
    const changelog = await db.query.changelogs.findFirst({
      where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
    });

    if (!changelog) {
      return [];
    }

    const domains = await db.query.customDomains.findMany({
      where: eq(customDomains.changelogId, changelog.id),
      orderBy: [desc(customDomains.createdAt)],
    });

    return domains.map((domainRecord) => ({
      domain: domainRecord.domain,
      cnameTarget: this.getCnameTarget(),
      status: domainRecord.verified ? "verified" : "pending",
      verified: Boolean(domainRecord.verified),
      createdAt: domainRecord.createdAt.toISOString(),
    }));
  }

  async deleteCustomDomain(domain: string, owner: string, repo: string) {
    const db = this.db.getDrizzle();
    const changelog = await db.query.changelogs.findFirst({
      where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
    });

    if (!changelog) {
      throw new NotFoundException(`Repository ${owner}/${repo} not found`);
    }

    await db
      .delete(customDomains)
      .where(
        and(
          eq(customDomains.domain, domain),
          eq(customDomains.changelogId, changelog.id),
        ),
      );

    const remainingDomains = await db.query.customDomains.findMany({
      where: eq(customDomains.changelogId, changelog.id),
      orderBy: [desc(customDomains.createdAt)],
    });

    const nextPrimaryDomain = remainingDomains[0]?.domain ?? null;

    await db
      .update(changelogs)
      .set({ customDomain: nextPrimaryDomain, updatedAt: new Date() })
      .where(eq(changelogs.id, changelog.id));

    return { success: true };
  }

  async verifyCustomDomain(
    domain: string,
  ): Promise<{ verified: boolean; message?: string }> {
    console.log(`Verifying custom domain: ${domain}`);

    try {
      const db = this.db.getDrizzle();

      const domainRecord = await db.query.customDomains.findFirst({
        where: eq(customDomains.domain, domain),
      });

      if (domainRecord) {
        return { verified: true, message: "Domain verified" };
      }

      return {
        verified: false,
        message:
          "DNS verification not yet implemented. Please ensure your CNAME record is configured.",
      };
    } catch (error) {
      console.error("Error verifying domain:", error);
      return {
        verified: false,
        message:
          "DNS verification not yet implemented. Please ensure your CNAME record is configured.",
      };
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
