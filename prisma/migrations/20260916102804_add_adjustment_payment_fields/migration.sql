/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `booking_adjustments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdjustmentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "booking_adjustments" ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "payment_status" "AdjustmentPaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transaction_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "booking_adjustments_transaction_id_key" ON "booking_adjustments"("transaction_id");
