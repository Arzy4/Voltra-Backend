import { PartialType } from "@nestjs/mapped-types";
import { IsIn, IsOptional } from "class-validator";
import { CreateBookingDto } from "./create-booking.dto";

export class UpdateBookingDto extends PartialType(
  CreateBookingDto,
) {
  @IsOptional()
  @IsIn([
    "PENDING",
    "CONFIRMED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED",
  ])
  status?: "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}