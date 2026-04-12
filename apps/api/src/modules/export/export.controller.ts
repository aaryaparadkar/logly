import { Controller, Get, Param } from "@nestjs/common";
import { ChangelogService } from "../changelog/changelog.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("export")
@Controller("export")
export class ExportController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get(":owner/:repo/markdown")
  @ApiOperation({ summary: "Export changelog as Markdown" })
  @ApiResponse({ status: 200, description: "Returns Markdown string" })
  async exportMarkdown(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
  ) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    return this.changelogService.buildExportMarkdown(data);
  }

  @Get(":owner/:repo/json")
  @ApiOperation({ summary: "Export changelog as JSON" })
  @ApiResponse({ status: 200, description: "Returns JSON object" })
  async exportJson(@Param("owner") owner: string, @Param("repo") repo: string) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    return this.changelogService.buildExportJson(data);
  }

  @Get(":owner/:repo/html")
  @ApiOperation({ summary: "Export changelog as HTML" })
  @ApiResponse({ status: 200, description: "Returns HTML string" })
  async exportHtml(@Param("owner") owner: string, @Param("repo") repo: string) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    return this.changelogService.buildExportHtml(data);
  }
}
