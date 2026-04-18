import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CryptoService } from "./crypto.service";
import { DatabaseService } from "../../db/database.service";
import { eq, and, desc } from "drizzle-orm";
import { changelogs, customDomains } from "../../db/schema";
import { resolveCname } from "node:dns/promises";

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

  private normalizeDomain(value: string): string {
    return value.trim().toLowerCase().replace(/\.$/, "");
  }

  private normalizeHostname(value: string): string {
    return value.trim().toLowerCase().replace(/\.$/, "");
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
    const normalizedDomain = this.normalizeDomain(domain);
    console.log(`Configuring custom domain: ${domain} for ${owner}/${repo}`);

    const db = this.db.getDrizzle();

    const existingChangelog = await db.query.changelogs.findFirst({
      where: and(eq(changelogs.owner, owner), eq(changelogs.repo, repo)),
    });

    if (!existingChangelog) {
      throw new NotFoundException(`Repository ${owner}/${repo} not found`);
    }

    const existingDomain = await db.query.customDomains.findFirst({
      where: eq(customDomains.domain, normalizedDomain),
    });

    if (existingDomain && existingDomain.changelogId !== existingChangelog.id) {
      throw new ConflictException(
        `Domain ${normalizedDomain} is already linked to another changelog`,
      );
    }

    await db
      .update(changelogs)
      .set({ customDomain: normalizedDomain, updatedAt: new Date() })
      .where(eq(changelogs.id, existingChangelog.id));

    if (!existingDomain) {
      await db.insert(customDomains).values({
        domain: normalizedDomain,
        changelogId: existingChangelog.id,
        verified: false,
      });
    } else {
      await db
        .update(customDomains)
        .set({ verified: false, verifiedAt: null })
        .where(eq(customDomains.id, existingDomain.id));
    }

    return {
      domain: normalizedDomain,
      cnameTarget: this.getCnameTarget(),
      status: "pending",
      owner,
      repo,
    };
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
    const normalizedDomain = this.normalizeDomain(domain);
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
          eq(customDomains.domain, normalizedDomain),
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
    const normalizedDomain = this.normalizeDomain(domain);
    console.log(`Verifying custom domain: ${domain}`);

    const db = this.db.getDrizzle();
    const domainRecord = await db.query.customDomains.findFirst({
      where: eq(customDomains.domain, normalizedDomain),
    });

    if (!domainRecord) {
      throw new NotFoundException(
        `Domain ${normalizedDomain} is not configured for any changelog`,
      );
    }

    const expectedTarget = this.normalizeHostname(this.getCnameTarget());

    try {
      const cnameRecords = await resolveCname(normalizedDomain);
      const normalizedRecords = cnameRecords.map((record) =>
        this.normalizeHostname(record),
      );

      const isVerified = normalizedRecords.includes(expectedTarget);

      await db
        .update(customDomains)
        .set({
          verified: isVerified,
          verifiedAt: isVerified ? new Date() : null,
        })
        .where(eq(customDomains.id, domainRecord.id));

      if (!isVerified) {
        return {
          verified: false,
          message: `CNAME mismatch. Expected ${expectedTarget} but found ${normalizedRecords.join(", ")}`,
        };
      }

      return { verified: true, message: "Domain verified" };
    } catch {
      await db
        .update(customDomains)
        .set({ verified: false, verifiedAt: null })
        .where(eq(customDomains.id, domainRecord.id));

      throw new BadRequestException(
        `No CNAME record found for ${normalizedDomain}. Add a CNAME pointing to ${expectedTarget} and try again.`,
      );
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
