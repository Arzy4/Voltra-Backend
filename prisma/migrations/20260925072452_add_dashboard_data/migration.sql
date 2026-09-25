-- CreateTable
CREATE TABLE "dashboard_kpis" (
    "id" SERIAL NOT NULL,
    "total_revenue" DECIMAL(14,2) NOT NULL,
    "total_bookings" INTEGER NOT NULL,
    "new_bookings" INTEGER NOT NULL,
    "completed_bookings" INTEGER NOT NULL,
    "available_stations" INTEGER NOT NULL,
    "available_charging_slots" INTEGER NOT NULL,

    CONSTRAINT "dashboard_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charging_type_performances" (
    "id" SERIAL NOT NULL,
    "type" "ChargerType" NOT NULL,
    "bookings" INTEGER NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "charging_type_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_status_statistics" (
    "id" SERIAL NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "payment_status_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_overview" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "revenue_overview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charging_type_performances_type_key" ON "charging_type_performances"("type");

-- CreateIndex
CREATE UNIQUE INDEX "payment_status_statistics_status_key" ON "payment_status_statistics"("status");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_overview_month_key" ON "revenue_overview"("month");
