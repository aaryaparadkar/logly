import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CryptoService } from "./crypto.service";

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
}

@Injectable()
export class SettingsService {
  private readonly baseUrl: string;

  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>("LOGLY_BASE_URL") || "logly.app";
  }

  async saveToken(
    userId: string,
    token: string,
  ): Promise<{ success: boolean }> {
    const encrypted = this.cryptoService.encrypt(token);
    // In real implementation, save to database
    console.log(
      `Token encrypted for user ${userId}: ${encrypted.slice(0, 20)}...`,
    );
    return { success: true };
  }

  async deleteToken(userId: string): Promise<{ success: boolean }> {
    // In real implementation, delete from database
    return { success: true };
  }

  async getToken(userId: string): Promise<string | null> {
    // In real implementation, fetch from database and decrypt
    // const encrypted = await db.query('SELECT token FROM users WHERE id = ?', [userId]);
    // return encrypted ? this.cryptoService.decrypt(encrypted) : null;
    return null;
  }

  getCustomDomainConfig(domain: string): CustomDomainResponse {
    return {
      domain,
      cnameTarget: `cname.${this.baseUrl}`,
      status: "pending",
    };
  }

  async verifyCustomDomain(
    domain: string,
    changelogId: string,
  ): Promise<{ verified: boolean }> {
    // In real implementation:
    // 1. Look up the expected TXT record for the domain
    // 2. Check DNS to verify it matches
    // 3. Update database to mark as verified
    return { verified: false };
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
