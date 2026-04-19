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
import { resolve4, resolve6, resolveCname } from "node:dns/promises";

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
  dnsRecords: DnsRecordInstruction[];
  message?: string;
  owner?: string;
  repo?: string;
}

export interface DnsRecordInstruction {
  type: string;
  name: string;
  value: string;
  reason?: string;
}

export interface RepoCustomDomain {
  domain: string;
  cnameTarget: string;
  status: "pending" | "verified";
  verified: boolean;
  createdAt: string;
  dnsRecords: DnsRecordInstruction[];
}

interface VercelDomainStatus {
  verified: boolean;
  dnsRecords: DnsRecordInstruction[];
  message?: string;
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

  private getVercelConfig() {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!token || !projectId) {
      return null;
    }

    return { token, projectId, teamId };
  }

  getVercelConfigStatus(): { configured: boolean; hasToken: boolean; hasProjectId: boolean; projectId?: string } {
    const hasToken = !!process.env.VERCEL_TOKEN;
    const hasProjectId = !!process.env.VERCEL_PROJECT_ID;
    return {
      configured: hasToken && hasProjectId,
      hasToken,
      hasProjectId,
      projectId: process.env.VERCEL_PROJECT_ID,
    };
  }

  private buildVercelUrl(path: string): string {
    const config = this.getVercelConfig();
    if (!config) {
      throw new Error("Vercel domain automation is not configured");
    }

    const url = new URL(`https://api.vercel.com${path}`);
    if (config.teamId) {
      url.searchParams.set("teamId", config.teamId);
    }

    return url.toString();
  }

  private async vercelRequest<T>(
    path: string,
    init: RequestInit,
  ): Promise<T | null> {
    const config = this.getVercelConfig();
    if (!config) {
      return null;
    }

    const response = await fetch(this.buildVercelUrl(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    } & T;

    if (!response.ok) {
      const message = body?.error?.message || "Vercel API request failed";
      throw new BadRequestException(message);
    }

    return body;
  }

  private getFallbackDnsRecords(domain: string): DnsRecordInstruction[] {
    const parts = domain.split(".");
    const name = parts[0] || domain;

    return [
      {
        type: "CNAME",
        name,
        value: this.getCnameTarget(),
        reason: "Point this domain to Logly routing",
      },
    ];
  }

  private getRecordsFromVercelPayload(payload: any): DnsRecordInstruction[] {
    const records = Array.isArray(payload?.verification)
      ? payload.verification
      : [];

    return records
      .map((record: any) => {
        const type =
          typeof record?.type === "string"
            ? String(record.type).toUpperCase()
            : "";
        const name =
          typeof record?.domain === "string"
            ? this.normalizeHostname(record.domain)
            : "";
        const value =
          typeof record?.value === "string"
            ? this.normalizeHostname(record.value)
            : "";

        if (!type || !name || !value) {
          return null;
        }

        return {
          type,
          name,
          value,
          reason:
            typeof record?.reason === "string" ? String(record.reason) : undefined,
        } satisfies DnsRecordInstruction;
      })
      .filter((record: DnsRecordInstruction | null): record is DnsRecordInstruction =>
        Boolean(record),
      );
  }

  private async getVercelDomainStatus(
    domain: string,
  ): Promise<VercelDomainStatus | null> {
    const config = this.getVercelConfig();
    if (!config) {
      return null;
    }

    console.log(`[getVercelDomainStatus] Checking domain: ${domain}`);

    const details = await this.vercelRequest<any>(
      `/v9/projects/${config.projectId}/domains/${domain}`,
      { method: "GET" },
    );

    console.log(`[getVercelDomainStatus] Response:`, JSON.stringify(details));

    const verified = Boolean(details?.verified);
    const dnsRecords = this.getRecordsFromVercelPayload(details);

    return {
      verified,
      dnsRecords,
      message: verified ? "Domain verified in Vercel" : "Domain pending in Vercel",
    };
  }

  private async ensureDomainOnVercel(domain: string): Promise<VercelDomainStatus | null> {
    const config = this.getVercelConfig();
    if (!config) {
      return null;
    }

    console.log(`[ensureDomainOnVercel] Adding domain: ${domain} to project: ${config.projectId}`);

    try {
      // First, try to add domain without project (will create under account)
      const addResult = await this.vercelRequest<any>(`/v6/domains`, {
        method: "POST",
        body: JSON.stringify({ 
          name: domain,
        }),
      });
      console.log(`[ensureDomainOnVercel] Add without project response:`, JSON.stringify(addResult));

      // Then assign to project
      if (addResult?.uid) {
        const assignResult = await this.vercelRequest<any>(
          `/v6/domains/${addResult.uid}/project`,
          {
            method: "POST",
            body: JSON.stringify({
              projectId: config.projectId,
              ...(config.teamId ? { teamId: config.teamId } : {})
            }),
          },
        );
        console.log(`[ensureDomainOnVercel] Assign to project response:`, JSON.stringify(assignResult));
      }
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        typeof error.message === "string" &&
        (error.message.toLowerCase().includes("already") ||
         error.message.toLowerCase().includes("in use") ||
         error.message.toLowerCase().includes("taken"))
      ) {
        console.log(`[ensureDomainOnVercel] Domain already exists or taken, continuing...`);
      } else {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[ensureDomainOnVercel] Error:`, errMsg);
        throw error;
      }
    }

    return this.getVercelDomainStatus(domain);
  }

  private async triggerVercelDomainVerification(
    domain: string,
  ): Promise<VercelDomainStatus | null> {
    const config = this.getVercelConfig();
    if (!config) {
      return null;
    }

    await this.vercelRequest<any>(
      `/v9/projects/${config.projectId}/domains/${domain}/verify`,
      { method: "POST" },
    );

    return this.getVercelDomainStatus(domain);
  }

  private async removeDomainFromVercel(domain: string): Promise<void> {
    const config = this.getVercelConfig();
    if (!config) {
      return;
    }

    await fetch(
      this.buildVercelUrl(`/v9/projects/${config.projectId}/domains/${domain}`),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      },
    ).catch(() => {
      // Best effort cleanup.
    });
  }

  private async resolveDomainAddresses(domain: string): Promise<boolean> {
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      resolve4(domain),
      resolve6(domain),
    ]);

    const hasIpv4 =
      ipv4Result.status === "fulfilled" && ipv4Result.value.length > 0;
    const hasIpv6 =
      ipv6Result.status === "fulfilled" && ipv6Result.value.length > 0;

    return hasIpv4 || hasIpv6;
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
      dnsRecords: this.getFallbackDnsRecords(domain),
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

    const vercelConfig = this.getVercelConfig();
    console.log(
      `[configureCustomDomain] Vercel config present: ${!!vercelConfig}, domain: ${normalizedDomain}`,
    );

    const vercelStatus = await this.ensureDomainOnVercel(normalizedDomain).catch((e) => {
      console.error(`[configureCustomDomain] Vercel error:`, e.message);
      return null;
    });
    const dnsRecords =
      vercelStatus?.dnsRecords.length
        ? vercelStatus.dnsRecords
        : this.getFallbackDnsRecords(normalizedDomain);

    const message = vercelStatus
      ? vercelStatus.message ||
        "Add the DNS records below, wait for propagation, then verify."
      : vercelConfig
        ? "Vercel automation failed. Add DNS records manually below, then verify."
        : "Add DNS records below (Vercel automation not configured), then verify.";

    console.log(
      `[configureCustomDomain] Stored: ${normalizedDomain}, dnsRecords: ${dnsRecords.length}`,
    );

    return {
      domain: normalizedDomain,
      cnameTarget: this.getCnameTarget(),
      status: "pending",
      dnsRecords,
      message,
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

    const withStatus = await Promise.all(
      domains.map(async (domainRecord) => {
        const vercelStatus = await this.getVercelDomainStatus(domainRecord.domain)
          .then((result) => result)
          .catch(() => null);

        const dnsRecords =
          vercelStatus?.dnsRecords.length
            ? vercelStatus.dnsRecords
            : this.getFallbackDnsRecords(domainRecord.domain);

        return {
          domain: domainRecord.domain,
          cnameTarget: this.getCnameTarget(),
          status: domainRecord.verified ? "verified" : "pending",
          verified: Boolean(domainRecord.verified),
          createdAt: domainRecord.createdAt.toISOString(),
          dnsRecords,
        } satisfies RepoCustomDomain;
      }),
    );

    return withStatus;
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

    await this.removeDomainFromVercel(normalizedDomain);

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
  ): Promise<{
    verified: boolean;
    message?: string;
    dnsRecords: DnsRecordInstruction[];
  }> {
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
    const dnsRecordsFallback = this.getFallbackDnsRecords(normalizedDomain);
    const vercelConfig = this.getVercelConfig();

    let vercelStatus = null;
    if (vercelConfig) {
      console.log(
        `[verifyCustomDomain] Triggering Vercel verification for: ${normalizedDomain}`,
      );
      vercelStatus = await this.triggerVercelDomainVerification(normalizedDomain).catch(
        (e) => {
          console.error(`[verifyCustomDomain] Vercel error:`, e.message);
          return this.getVercelDomainStatus(normalizedDomain).catch(() => null);
        },
      );
    }

    const dnsRecords =
      vercelStatus?.dnsRecords.length
        ? vercelStatus.dnsRecords
        : dnsRecordsFallback;

    const hasIpAddress = await this.resolveDomainAddresses(normalizedDomain);

    if (!hasIpAddress) {
      await db
        .update(customDomains)
        .set({ verified: false, verifiedAt: null })
        .where(eq(customDomains.id, domainRecord.id));

      return {
        verified: false,
        message:
          `${normalizedDomain} does not resolve yet. Add the DNS records below and wait for propagation.`,
        dnsRecords,
      };
    }

    if (vercelStatus) {
      await db
        .update(customDomains)
        .set({
          verified: vercelStatus.verified,
          verifiedAt: vercelStatus.verified ? new Date() : null,
        })
        .where(eq(customDomains.id, domainRecord.id));

      return {
        verified: vercelStatus.verified,
        message:
          vercelStatus.message ||
          (vercelStatus.verified
            ? "Domain verified"
            : "Domain is not verified in Vercel yet"),
        dnsRecords,
      };
    }

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
          dnsRecords,
        };
      }

      return { verified: true, message: "Domain verified", dnsRecords };
    } catch {
      await db
        .update(customDomains)
        .set({ verified: false, verifiedAt: null })
        .where(eq(customDomains.id, domainRecord.id));

      return {
        verified: false,
        message: `No CNAME record found for ${normalizedDomain}. Add a CNAME pointing to ${expectedTarget} and try again.`,
        dnsRecords,
      };
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
