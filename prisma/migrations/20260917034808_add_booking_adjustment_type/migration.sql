-- CreateEnum
CREATE TYPE "BookingAdjustmentType" AS ENUM ('ADDITIONAL_PAYMENT', 'REFUND');

-- AlterTable
ALTER TABLE "booking_adjustments" ADD COLUMN     "type" "BookingAdjustmentType" NOT NULL DEFAULT 'ADDITIONAL_PAYMENT';
