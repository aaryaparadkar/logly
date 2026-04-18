import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
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
      .where(eq(customDomains.domain, normalizedDomain))
      .limit(1);

    return mapping[0] ?? null;
  }
}
