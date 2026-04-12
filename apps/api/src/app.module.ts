import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./db/database.module";
import { ChangelogModule } from "./modules/changelog/changelog.module";
import { GithubModule } from "./modules/github/github.module";
import { AiModule } from "./modules/ai/ai.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { ExportModule } from "./modules/export/export.module";
import { CustomDomainsModule } from "./modules/custom-domains/custom-domains.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    ChangelogModule,
    GithubModule,
    AiModule,
    SettingsModule,
    ExportModule,
    CustomDomainsModule,
  ],
})
export class AppModule {}
