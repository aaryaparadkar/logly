import { Module } from "@nestjs/common";
import { ChangelogController } from "./changelog.controller";
import { ChangelogService } from "./changelog.service";
import { GithubModule } from "../github/github.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [GithubModule, AiModule],
  controllers: [ChangelogController],
  providers: [ChangelogService],
  exports: [ChangelogService],
})
export class ChangelogModule {}
