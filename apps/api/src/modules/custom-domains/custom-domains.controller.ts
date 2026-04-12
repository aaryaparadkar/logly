import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("custom-domains")
@Controller("custom-domains")
export class CustomDomainsController {
  @Get(":domain")
  @ApiOperation({ summary: "Get changelog by custom domain" })
  @ApiResponse({
    status: 200,
    description: "Returns owner and repo for the domain",
  })
  @ApiResponse({ status: 404, description: "Domain not found" })
  async getByDomain(@Param("domain") domain: string) {
    // In a real implementation, this would query the database
    // For now, return null to indicate no mapping exists
    // The database would have:
    // SELECT c.owner, c.repo FROM custom_domains cd
    // JOIN changelogs c ON cd.changelog_id = c.id
    // WHERE cd.domain = :domain AND cd.verified = true

    return null;
  }
}
