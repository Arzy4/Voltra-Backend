import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: number) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    };
  }

  async findOne(
    id: number,
    userId: number,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access this vehicle',
      );
    }

    return {
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    };
  }

  async create(
    userId: number,
    createVehicleDto: CreateVehicleDto,
  ) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        userId,
        vehicleName: createVehicleDto.vehicleName,
        brand: createVehicleDto.brand,
        model: createVehicleDto.model,
        preferredChargerType:
          createVehicleDto.preferredChargerType,
        defaultChargingDuration:
          createVehicleDto.defaultChargingDuration,
      },
    });

    return {
      message: 'Vehicle created successfully',
      data: vehicle,
    };
  }

  async update(
    id: number,
    userId: number,
    updateVehicleDto: UpdateVehicleDto,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this vehicle',
      );
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: {
        id,
      },
      data: updateVehicleDto,
    });

    return {
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    };
  }

  async remove(
    id: number,
    userId: number,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this vehicle',
      );
    }

    await this.prisma.vehicle.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Vehicle deleted successfully',
    };
  }
}