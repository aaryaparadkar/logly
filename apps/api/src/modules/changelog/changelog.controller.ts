import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  ChangelogService,
  ChangelogData,
  ChangelogStats,
} from "./changelog.service";
import { CreateChangelogDto, UpdateChangelogDto } from "./dto/changelog.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

class TokenQueryDto {
  @IsOptional()
  @IsString()
  token?: string;
}

@ApiTags("changelog")
@Controller("changelogs")
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    short: { limit: 3, ttl: 1000 },
    medium: { limit: 10, ttl: 10000 },
  })
  @ApiOperation({
    summary: "Generate a new changelog from a GitHub repository",
  })
  @ApiResponse({ status: 201, description: "Changelog generated successfully" })
  @ApiResponse({ status: 404, description: "Repository not found" })
  async generateChangelog(
    @Body() dto: CreateChangelogDto,
    @Query() query: TokenQueryDto,
  ) {
    const token = dto.token || query.token;
    return this.changelogService.generateChangelog({ ...dto, token });
  }

  @Get(":owner/:repo")
  @ApiOperation({ summary: "Get an existing changelog" })
  @ApiResponse({ status: 404, description: "Changelog not found" })
  async getChangelog(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
  ) {
    return this.changelogService.generateChangelog({ owner, repo });
  }

  @Put(":owner/:repo")
  @ApiOperation({ summary: "Update a changelog (requires write access)" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Changelog updated successfully" })
  @ApiResponse({ status: 403, description: "No write access to repository" })
  async updateChangelog(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Body() dto: UpdateChangelogDto,
    @Query() query: TokenQueryDto,
  ) {
    const token = dto.token || query.token;
    return this.changelogService.updateChangelog(owner, repo, dto.data!, token);
  }

  @Post(":owner/:repo/regenerate/:entryId")
  @ApiOperation({ summary: "Regenerate a single changelog entry" })
  @ApiBearerAuth()
  async regenerateEntry(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Param("entryId") entryId: string,
    @Query() query: TokenQueryDto,
  ) {
    const token = query.token;
    return this.changelogService.regenerateEntry(owner, repo, entryId, token);
  }

  @Get(":owner/:repo/export/markdown")
  @ApiOperation({ summary: "Export changelog as Markdown" })
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

  @Get(":owner/:repo/export/json")
  @ApiOperation({ summary: "Export changelog as JSON" })
  async exportJson(@Param("owner") owner: string, @Param("repo") repo: string) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    return this.changelogService.buildExportJson(data);
  }

  @Get(":owner/:repo/export/html")
  @ApiOperation({ summary: "Export changelog as HTML" })
  async exportHtml(@Param("owner") owner: string, @Param("repo") repo: string) {
    const { data } = await this.changelogService.generateChangelog({
      owner,
      repo,
    });
    return this.changelogService.buildExportHtml(data);
  }
}
