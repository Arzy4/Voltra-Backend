import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  BookingStatus,
  ChargerType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  SlotStatus,
  StationStatus,
  UserRole,
} from "../src/generated/prisma/client";

import { ChargingStationsData } from "./data/chargingStationsData";
import { KpiData } from "./data/kpiData";
import { ChargingTypePerformanceData } from "./data/chargingTypePerformances";
import { PaymentStatusData } from "./data/paymentStatus";
import { RevenueOverviewData } from "./data/revenueOverview";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the .env file.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Convert frontend station status into Prisma StationStatus.
 *
 * Your Prisma enum only contains:
 * AVAILABLE, BUSY, MAINTENANCE, INACTIVE
 */
function mapStationStatus(status: string): StationStatus {
  switch (status) {
    case "Available":
      return StationStatus.AVAILABLE;

    case "Maintenance":
      return StationStatus.MAINTENANCE;

    case "Inactive":
      return StationStatus.INACTIVE;

    default:
      return StationStatus.AVAILABLE;
  }
}

function mapChargerType(type: string): ChargerType {
  switch (type) {
    case "Normal":
      return ChargerType.NORMAL;

    case "Fast":
      return ChargerType.FAST;

    case "Ultra":
      return ChargerType.ULTRA;

    default:
      throw new Error(`Unknown charger type: ${type}`);
  }
}

function getChargerPrefix(type: string): string {
  switch (type) {
    case "Normal":
      return "N";

    case "Fast":
      return "F";

    case "Ultra":
      return "U";

    default:
      throw new Error(`Unknown charger type: ${type}`);
  }
}

function getPricePerKwh(type: string): string {
  switch (type) {
    case "Normal":
      return "2500.00";

    case "Fast":
      return "3750.00";

    case "Ultra":
      return "5500.00";

    default:
      throw new Error(`Unknown charger type: ${type}`);
  }
}

function createStationCode(stationId: number): string {
  return `ST${stationId.toString().padStart(2, "0")}`;
}

/**
 * Convert this frontend structure:
 *
 * {
 *   type: "Fast",
 *   total: 4,
 *   available: 2
 * }
 *
 * into four separate database slots:
 *
 * F01 AVAILABLE
 * F02 AVAILABLE
 * F03 OCCUPIED
 * F04 OCCUPIED
 */
function createSlotsForStation(
  stationId: number,
  chargingTypes: {
    type: "Normal" | "Fast" | "Ultra";
    power: number;
    total: number;
    available: number;
  }[],
) {
  const stationCode = createStationCode(stationId);

  return chargingTypes.flatMap((chargingType) => {
    const chargerPrefix = getChargerPrefix(
      chargingType.type,
    );

    return Array.from(
      { length: chargingType.total },
      (_, index) => {
        const slotNumber = index + 1;

        return {
          slotCode: `${stationCode}-${chargerPrefix}${slotNumber
            .toString()
            .padStart(2, "0")}`,

          chargerType: mapChargerType(
            chargingType.type,
          ),

          powerKw: chargingType.power,

          pricePerKwh: getPricePerKwh(
            chargingType.type,
          ),

          status:
            index < chargingType.available
              ? SlotStatus.AVAILABLE
              : SlotStatus.OCCUPIED,
        };
      },
    );
  });
}

type CreatedStationWithSlots =
  Prisma.ChargingStationGetPayload<{
    include: {
      slots: true;
    };
  }>;

async function main(): Promise<void> {
  console.log("Starting Voltra database seed...");

  const adminPasswordHash = await bcrypt.hash(
    "Admin123!",
    10,
  );

  const userPasswordHash = await bcrypt.hash(
    "User123!",
    10,
  );

  // ---------------------------------------
  // Users
  // ---------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@voltra.com",
    },
    update: {
      fullName: "Voltra Administrator",
      phoneNumber: "081234567890",
      role: UserRole.ADMIN,
    },
    create: {
      fullName: "Voltra Administrator",
      email: "admin@voltra.com",
      passwordHash: adminPasswordHash,
      phoneNumber: "081234567890",
      role: UserRole.ADMIN,
    },
  });

  const robby = await prisma.user.upsert({
    where: {
      email: "robby@example.com",
    },
    update: {
      fullName: "Robby Arzy",
      phoneNumber: "081234567891",
      role: UserRole.USER,
    },
    create: {
      fullName: "Robby Arzy",
      email: "robby@example.com",
      passwordHash: userPasswordHash,
      phoneNumber: "081234567891",
      role: UserRole.USER,
    },
  });

  const maya = await prisma.user.upsert({
    where: {
      email: "maya@example.com",
    },
    update: {
      fullName: "Maya Pratama",
      phoneNumber: "081234567892",
      role: UserRole.USER,
    },
    create: {
      fullName: "Maya Pratama",
      email: "maya@example.com",
      passwordHash: userPasswordHash,
      phoneNumber: "081234567892",
      role: UserRole.USER,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // ---------------------------------------
  // 20 charging stations and their slots
  // ---------------------------------------

  const createdStations: CreatedStationWithSlots[] = [];

  for (const mockStation of ChargingStationsData) {
    const createdStation =
  await prisma.chargingStation.upsert({
    where: {
      id: mockStation.id,
    },

    update: {
      name: mockStation.name,
      location: mockStation.location,
      area: mockStation.area,
      address: mockStation.address,

      latitude:
        mockStation.latitude.toString(),

      longitude:
        mockStation.longitude.toString(),

      status: mapStationStatus(
        mockStation.status,
      ),
    },

    create: {
      id: mockStation.id,
      name: mockStation.name,
      location: mockStation.location,
      area: mockStation.area,
      address: mockStation.address,

      latitude:
        mockStation.latitude.toString(),

      longitude:
        mockStation.longitude.toString(),

      status: mapStationStatus(
        mockStation.status,
      ),
    },

    include: {
      slots: true,
    },
  });
  createdStations.push(createdStation);

  const slots = createSlotsForStation(
    mockStation.id,
    mockStation.chargingTypes,
  );

  for (const slot of slots) {
    await prisma.chargingSlot.upsert({
      where: {
        stationId_slotCode: {
          stationId: createdStation.id,
          slotCode: slot.slotCode,
        },
      },

      update: {
        stationId: createdStation.id,
        chargerType: slot.chargerType,
        powerKw: slot.powerKw,
        pricePerKwh: slot.pricePerKwh,
      },

      create: {
        stationId: createdStation.id,
        slotCode: slot.slotCode,
        chargerType: slot.chargerType,
        powerKw: slot.powerKw,
        pricePerKwh: slot.pricePerKwh,
        status: slot.status,
      },
    });
  }

  console.log(
    `Updated ${createdStation.name} with ${createdStation.slots.length} slots.`,
  );
}

  // ---------------------------------------
  // Find slots for bookings
  // ---------------------------------------

  const tunjunganFastSlot =
    await prisma.chargingSlot.findFirst({
      where: {
        slotCode: "ST01-F01",
      },
    });

  const pakuwonUltraSlot =
    await prisma.chargingSlot.findFirst({
      where: {
        slotCode: "ST05-U01",
      },
    });

  const galaxyFastSlot =
    await prisma.chargingSlot.findFirst({
      where: {
        slotCode: "ST10-F01",
      },
    });

  if (
    !tunjunganFastSlot ||
    !pakuwonUltraSlot ||
    !galaxyFastSlot
  ) {
    throw new Error(
      "One or more charging slots required for bookings were not created.",
    );
  }

  // ---------------------------------------
  // Bookings
  // ---------------------------------------

  const seedBookings = [
    {
      userId: robby.id,
      slotId: tunjunganFastSlot.id,
      bookingCode: "VOL-202607-001",
      startTime: new Date("2026-07-20T03:00:00.000Z"),
      endTime: new Date("2026-07-20T04:00:00.000Z"),
      estimatedKwh: "30.00",
      estimatedCost: "112500.00",
      status: BookingStatus.CONFIRMED,
    },
    {
      userId: maya.id,
      slotId: pakuwonUltraSlot.id,
      bookingCode: "VOL-202607-002",
      startTime: new Date("2026-07-21T06:00:00.000Z"),
      endTime: new Date("2026-07-21T06:45:00.000Z"),
      estimatedKwh: "40.00",
      estimatedCost: "220000.00",
      status: BookingStatus.PENDING,
    },
    {
      userId: robby.id,
      slotId: galaxyFastSlot.id,
      bookingCode: "VOL-202607-003",
      startTime: new Date("2026-07-10T02:00:00.000Z"),
      endTime: new Date("2026-07-10T03:00:00.000Z"),
      estimatedKwh: "25.00",
      estimatedCost: "93750.00",
      status: BookingStatus.COMPLETED,
    },
  ];

  for (const booking of seedBookings) {
    await prisma.booking.upsert({
      where: {
        bookingCode: booking.bookingCode,
      },

      update: {
        userId: booking.userId,
        slotId: booking.slotId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        estimatedKwh: booking.estimatedKwh,
        estimatedCost: booking.estimatedCost,
      },

      create: booking,
    });
  }

  // ---------------------------------------
  // Payments
  // ---------------------------------------
  const robbyBooking1 = await prisma.booking.findUnique({
    where: {
      bookingCode: "VOL-202607-001",
    },
  });

  const mayaBooking = await prisma.booking.findUnique({
    where: {
      bookingCode: "VOL-202607-002",
    },
  });

  const robbyBooking2 = await prisma.booking.findUnique({
    where: {
      bookingCode: "VOL-202607-003",
    },
  });

  if (!robbyBooking1 || !mayaBooking || !robbyBooking2) {
    throw new Error(
      "One or more bookings required for payments were not found.",
    );
  }

  const seedPayments = [
    {
      bookingId: robbyBooking1.id,
      amount: "112500.00",
      paymentMethod: PaymentMethod.E_WALLET,
      status: PaymentStatus.PAID,
      transactionId: "VOL-PAY-001",
    },
    {
      bookingId: mayaBooking.id,
      amount: "220000.00",
      paymentMethod: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
      transactionId: "VOL-PAY-002",
    },
    {
      bookingId: robbyBooking2.id,
      amount: "93750.00",
      paymentMethod: PaymentMethod.E_WALLET,
      status: PaymentStatus.PAID,
      transactionId: "VOL-PAY-003",
    },
  ];

  for (const payment of seedPayments) {
    await prisma.payment.upsert({
      where: {
        bookingId: payment.bookingId,
      },

      update: {
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
      },

      create: payment,
    });
  }

  // ---------------------------------------
  // Dashboard KPI
  // ---------------------------------------

  await prisma.dashboardKpi.deleteMany();

  await prisma.dashboardKpi.create({
    data: {
      totalRevenue: KpiData.totalRevenue,
      totalBookings: KpiData.totalBookings,
      newBookings: KpiData.newBookings,
      completedBookings: KpiData.completedBookings,
      availableStations: KpiData.availableStations,
      availableChargingSlots: KpiData.availableChargingSlots,
    },
  });

  console.log("Dashboard KPI data seeded successfully.");

    // ---------------------------------------
  // Charging Type Performance
  // ---------------------------------------

  await prisma.chargingTypePerformance.deleteMany();

  for (const performance of ChargingTypePerformanceData) {
    await prisma.chargingTypePerformance.create({
      data: {
        type: performance.type as ChargerType,
        bookings: performance.bookings,
        revenue: performance.revenue,
      },
    });
  }

  console.log(
    "Charging type performance data seeded successfully.",
  );

  // ---------------------------------------
  // Payment Status Statistics
  // ---------------------------------------

  await prisma.paymentStatusStatistic.deleteMany();

  for (const paymentStatus of PaymentStatusData) {
    await prisma.paymentStatusStatistic.create({
      data: {
        status: paymentStatus.status as PaymentStatus,
        value: paymentStatus.value,
      },
    });
  }

  console.log(
    "Payment status statistics data seeded successfully.",
  );

    // ---------------------------------------
  // Revenue Overview
  // ---------------------------------------

  await prisma.revenueOverview.deleteMany();

  for (const revenueOverview of RevenueOverviewData) {
    await prisma.revenueOverview.create({
      data: {
        month: revenueOverview.month,
        revenue: revenueOverview.revenue,
      },
    });
  }

  console.log(
    "Revenue overview data seeded successfully.",
  );

  const totalSlots = createdStations.reduce(
    (total, station) =>
      total + station.slots.length,
    0,
  );

  console.log("");
  console.log(
    "Voltra mock data seeded successfully.",
  );
  console.log("Created:");
  console.log("- 3 users");
  console.log(
    `- ${createdStations.length} charging stations`,
  );
  console.log(`- ${totalSlots} charging slots`);
  console.log("- 3 bookings");
  console.log("- 3 payments");
}


main()
  .catch((error: unknown) => {
    console.error(
      "Failed to seed the Voltra database:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });