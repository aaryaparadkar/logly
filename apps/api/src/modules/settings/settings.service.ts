import { Injectable, NotFoundException } from "@nestjs/common";
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
  owner?: string;
  repo?: string;
}

@Injectable()
export class SettingsService {
  private readonly baseUrl: string;

  constructor(
    private cryptoService: CryptoService,
    private configService?: ConfigService,
  ) {
    this.baseUrl = process.env.LOGLY_BASE_URL || "logly.app";
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
      cnameTarget: `cname.${this.baseUrl}`,
      status: "pending",
    };
  }

  async configureCustomDomain(
    domain: string,
    owner: string,
    repo: string,
  ): Promise<CustomDomainResponse> {
    console.log(`Configuring custom domain: ${domain} for ${owner}/${repo}`);

    return {
      domain,
      cnameTarget: `cname.${this.baseUrl}`,
      status: "pending",
      owner,
      repo,
    };
  }

  async verifyCustomDomain(
    domain: string,
  ): Promise<{ verified: boolean; message?: string }> {
    console.log(`Verifying custom domain: ${domain}`);

    return {
      verified: false,
      message:
        "DNS verification not yet implemented. Please ensure your CNAME record is configured.",
    };
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
