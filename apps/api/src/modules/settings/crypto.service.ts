import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

@Injectable()
export class CryptoService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 16;
  private readonly tagLength = 16;
  private readonly secret: string;

  constructor(private configService: ConfigService) {
    this.secret =
      this.configService.get<string>("ENCRYPTION_SECRET") ||
      "default-secret-change-in-production";
  }

  private deriveKey(salt: Buffer): Buffer {
    return scryptSync(this.secret, salt, this.keyLength);
  }

  encrypt(plaintext: string): string {
    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);
    const key = this.deriveKey(salt);

    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Format: salt + iv + tag + encrypted (all base64 encoded)
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString("base64");
  }

  decrypt(ciphertext: string): string {
    const data = Buffer.from(ciphertext, "base64");

    const salt = data.subarray(0, this.saltLength);
    const iv = data.subarray(this.saltLength, this.saltLength + this.ivLength);
    const tag = data.subarray(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength,
    );
    const encrypted = data.subarray(
      this.saltLength + this.ivLength + this.tagLength,
    );

    const key = this.deriveKey(salt);
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  }

  isEncrypted(value: string): boolean {
    try {
      const data = Buffer.from(value, "base64");
      return data.length > this.saltLength + this.ivLength + this.tagLength;
    } catch {
      return false;
    }
  }
}
