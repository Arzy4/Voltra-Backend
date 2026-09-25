import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get my vehicle presets',
    description:
      'Retrieve all vehicle presets belonging to the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Vehicles retrieved successfully.',
  })
  findAll(
    @Request() req: any,
  ) {
    return this.vehiclesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get vehicle preset by ID',
    description:
      'Retrieve a vehicle preset belonging to the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Vehicle retrieved successfully.',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.vehiclesService.findOne(
      id,
      req.user.id,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a vehicle preset',
    description:
      'Create a vehicle preset for the currently authenticated user.',
  })
  @ApiCreatedResponse({
    description: 'Vehicle created successfully.',
  })
  create(
    @Request() req: any,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(
      req.user.id,
      createVehicleDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update vehicle preset',
    description:
      'Update a vehicle preset belonging to the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Vehicle updated successfully.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(
      id,
      req.user.id,
      updateVehicleDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete vehicle preset',
    description:
      'Delete a vehicle preset belonging to the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Vehicle deleted successfully.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.vehiclesService.remove(
      id,
      req.user.id,
    );
  }
}