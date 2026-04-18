import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "../../db/database.service";
import { changelogs, customDomains } from "../../db/schema";

export interface DomainMapping {
  owner: string;
  repo: string;
}

@Injectable()
export class CustomDomainsService {
  constructor(private readonly db: DatabaseService) {}

  private normalizeDomain(value: string): string {
    const withoutPort = value.trim().toLowerCase().split(":")[0] || "";
    return withoutPort.replace(/\.$/, "");
  }

  async getVerifiedDomainMapping(domain: string): Promise<DomainMapping | null> {
    const normalizedDomain = this.normalizeDomain(domain);
    if (!normalizedDomain) {
      return null;
    }

    const db = this.db.getDrizzle();
    const mapping = await db
      .select({
        owner: changelogs.owner,
        repo: changelogs.repo,
      })
      .from(customDomains)
      .innerJoin(changelogs, eq(customDomains.changelogId, changelogs.id))
      .where(
        and(
          eq(customDomains.domain, normalizedDomain),
          eq(customDomains.verified, true),
        ),
      )
      .limit(1);

    return mapping[0] ?? null;
  }
}
