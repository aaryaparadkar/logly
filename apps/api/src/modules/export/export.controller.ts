import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChangelogService } from "../changelog/changelog.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";

@ApiTags("export")
@Controller("export")
export class ExportController {
  constructor(
    private readonly changelogService: ChangelogService,
    private readonly configService: ConfigService,
  ) {}

  @Get(":owner/:repo/markdown")
  @ApiOperation({ summary: "Export changelog as Markdown" })
  @ApiResponse({ status: 200, description: "Returns Markdown string" })
  async exportMarkdown(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Res() res?: Response,
  ) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    const content = this.changelogService.buildExportMarkdown(data);
    if (res) {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${repo}-changelog.md"`);
      return res.send(content);
    }
    return content;
  }

  @Get(":owner/:repo/json")
  @ApiOperation({ summary: "Export changelog as JSON" })
  @ApiResponse({ status: 200, description: "Returns JSON object" })
  async exportJson(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Res() res?: Response,
  ) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    const content = this.changelogService.buildExportJson(data);
    if (res) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${repo}-changelog.json"`);
      return res.send(content);
    }
    return content;
  }

  @Get(":owner/:repo/html")
  @ApiOperation({ summary: "Export changelog as static HTML" })
  @ApiResponse({ status: 200, description: "Returns static HTML string" })
  async exportHtml(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Res() res?: Response,
  ) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    const content = this.changelogService.buildExportHtml(data);
    if (res) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${repo}-changelog.html"`);
      return res.send(content);
    }
    return content;
  }

  @Get(":owner/:repo/dynamic")
  @ApiOperation({
    summary:
      "Export dynamic changelog page that auto-refreshes (for self-hosted deployments)",
  })
  @ApiResponse({ status: 200, description: "Returns dynamic HTML with JS" })
  async exportDynamic(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Query("apiUrl") apiUrl?: string,
    @Res() res?: Response,
  ) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });

    const defaultApiUrl =
      this.configService.get("NEXT_PUBLIC_API_URL") ||
      "https://logly-api.vercel.app";
    const resolvedApiUrl = apiUrl || defaultApiUrl;

    const html = this.changelogService.buildDynamicHtml(data, owner, repo, resolvedApiUrl);

    if (res) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${repo}-changelog.html"`,
      );
      return res.send(html);
    }

    return html;
  }
}
