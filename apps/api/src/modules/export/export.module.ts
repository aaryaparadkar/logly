import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ChangelogModule } from "../changelog/changelog.module";

@Module({
  imports: [ChangelogModule],
  controllers: [ExportController],
})
export class ExportModule {}
