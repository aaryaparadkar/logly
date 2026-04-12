import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

class TokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

class DomainDto {
  @IsString()
  @IsNotEmpty()
  domain!: string;
}

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save GitHub token (encrypted)" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Token saved successfully" })
  async saveToken(
    @Body() dto: TokenDto,
    @Headers("x-user-id") userId: string = "anonymous",
  ) {
    return this.settingsService.saveToken(userId, dto.token);
  }

  @Delete("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete stored GitHub token" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Token deleted successfully" })
  async deleteToken(@Headers("x-user-id") userId: string = "anonymous") {
    return this.settingsService.deleteToken(userId);
  }

  @Get("token/status")
  @ApiOperation({ summary: "Check if token is stored" })
  async getTokenStatus(@Headers("x-user-id") userId: string = "anonymous") {
    const hasToken = (await this.settingsService.getToken(userId)) !== null;
    return { hasToken };
  }

  @Post("domain")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Configure custom domain" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Domain configuration returned" })
  async configureDomain(@Body() dto: DomainDto) {
    return this.settingsService.getCustomDomainConfig(dto.domain);
  }

  @Post("domain/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify custom domain DNS configuration" })
  @ApiBearerAuth()
  async verifyDomain(@Body() dto: DomainDto) {
    return this.settingsService.verifyCustomDomain(dto.domain, "changelog-id");
  }

  @Get("base-url")
  @ApiOperation({ summary: "Get the base URL for the application" })
  async getBaseUrl() {
    return { baseUrl: this.settingsService.getBaseUrl() };
  }
}
