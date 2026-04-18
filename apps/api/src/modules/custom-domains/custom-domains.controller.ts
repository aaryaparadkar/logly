import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CustomDomainsService } from "./custom-domains.service";

@ApiTags("custom-domains")
@Controller("custom-domains")
export class CustomDomainsController {
  constructor(private readonly customDomainsService: CustomDomainsService) {}

  @Get(":domain")
  @ApiOperation({ summary: "Get changelog by custom domain" })
  @ApiResponse({
    status: 200,
    description: "Returns owner and repo for the domain",
  })
  @ApiResponse({ status: 404, description: "Domain not found" })
  async getByDomain(@Param("domain") domain: string) {
    const mapping = await this.customDomainsService.getVerifiedDomainMapping(
      domain,
    );

    if (!mapping) {
      throw new NotFoundException("Domain not found or not verified");
    }

    return mapping;
  }
}
