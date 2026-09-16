-- CreateEnum
CREATE TYPE "BookingAdjustmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "booking_adjustments" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "estimated_kwh" DECIMAL(10,2) NOT NULL,
    "estimated_cost" DECIMAL(12,2) NOT NULL,
    "adjustment_amount" DECIMAL(12,2) NOT NULL,
    "status" "BookingAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_adjustments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_adjustments" ADD CONSTRAINT "booking_adjustments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
