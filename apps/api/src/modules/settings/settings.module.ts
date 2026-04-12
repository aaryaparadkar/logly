import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { CryptoService } from "./crypto.service";

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, CryptoService],
  exports: [SettingsService, CryptoService],
})
export class SettingsModule {}
