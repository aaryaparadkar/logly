import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { ChangeType } from "../ai/ai.service";

export class CreateChangelogDto {
  @IsString()
  owner!: string;

  @IsString()
  repo!: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsNumber()
  limit?: number = 100;
}

export class UpdateChangelogDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ChangelogDataDto)
  data?: ChangelogDataDto;

  @IsOptional()
  @IsString()
  token?: string;
}

export class ChangeEntryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(["feature", "fix", "improvement", "breaking", "docs", "chore"])
  type!: ChangeType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  commitHash!: string;

  @IsString()
  author!: string;

  @IsDateString()
  date!: string;
}

export class VersionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  version!: string;

  @IsString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeEntryDto)
  entries!: ChangeEntryDto[];
}

export class ChangelogDataDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VersionDto)
  versions!: VersionDto[];
}

export class GenerateChangelogResponse {
  owner: string;
  repo: string;
  data: ChangelogDataDto;
  stats: {
    versions: number;
    changes: number;
    contributors: number;
  };
}
