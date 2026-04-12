import { Module } from "@nestjs/common";
import { CustomDomainsController } from "./custom-domains.controller";

@Module({
  controllers: [CustomDomainsController],
})
export class CustomDomainsModule {}
