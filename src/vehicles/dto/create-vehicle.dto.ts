import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ChargerType } from '../../generated/prisma/enums';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  vehicleName!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsEnum(ChargerType)
  preferredChargerType!: ChargerType;

  @IsInt()
  @Min(1)
  @Max(1440)
  defaultChargingDuration!: number;
}