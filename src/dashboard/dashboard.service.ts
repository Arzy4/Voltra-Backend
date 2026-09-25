import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard() {
    const [
      kpi,
      chargingTypePerformance,
      paymentStatus,
      revenueOverview,
    ] = await Promise.all([
      this.prisma.dashboardKpi.findFirst(),
      this.prisma.chargingTypePerformance.findMany({
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.paymentStatusStatistic.findMany({
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.revenueOverview.findMany({
        orderBy: {
          id: 'asc',
        },
      }),
    ]);

    if (!kpi) {
      throw new NotFoundException(
        'Dashboard KPI data not found',
      );
    }

    return {
      kpi: {
        ...kpi,
        totalRevenue: Number(kpi.totalRevenue),
      },

      chargingTypePerformance: chargingTypePerformance.map(
        (performance) => ({
          ...performance,
          revenue: Number(performance.revenue),
        }),
      ),

      paymentStatus,

      revenueOverview: revenueOverview.map((revenue) => ({
        ...revenue,
        revenue: Number(revenue.revenue),
      })),
    };
  }
}