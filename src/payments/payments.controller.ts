import { 
  Controller, 
  Body,
  Get, 
  UseGuards, 
  Request, 
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payments.dto';
import { UpdatePaymentDto } from './dto/update-payments.dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@Controller('payments')
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  
  @ApiResponse({ status: 200, description: 'Retrieve all payments belonging to the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Request() req) {
    return this.paymentsService.findAll(
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  findHistory(@Request() req: any) {
    return this.paymentsService.findHistory(
      req.user.id,
      req.user.role,
    );
  }

  @ApiResponse({ status: 200, description: 'Retrieve a payment by ID belonging to the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.paymentsService.findOne(id, req.user.id, req.user.role);
  }

  @ApiResponse({
    status: 200,
    description: 'Retrieve a booking adjustment for additional payment',
  })
  @UseGuards(JwtAuthGuard)
  @Get("adjustments/:id")
  findAdjustment(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.paymentsService.findAdjustment(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @ApiResponse({ status: 201, description: 'Create a payment for the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req,
  ) {
    return this.paymentsService.create(
      createPaymentDto,
      req.user.id,
      req.user.role
    );
  }

  @ApiResponse({ status: 200, description: 'Update a payment belonging to the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req,
  ) {
    return this.paymentsService.update(
      id,
      updatePaymentDto,
      req.user.id,
      req.user.role
    );
  }

  @ApiResponse({
    status: 200,
    description:
      'Complete a payment and confirm the related booking',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/complete")
  completePayment(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.paymentsService.completePayment(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @ApiResponse({
    status: 200,
    description:
      'Complete an additional payment and apply the booking adjustment',
  })
  @UseGuards(JwtAuthGuard)
  @Patch("adjustments/:id/complete")
  completeAdjustmentPayment(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.paymentsService.completeAdjustmentPayment(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @ApiResponse({ status: 200, description: 'Delete a payment belonging to the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.paymentsService.remove(
      id,
      req.user.id,
      req.user.role
    );
  }
  
}
