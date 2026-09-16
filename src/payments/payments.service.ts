import { 
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payments.dto';
import { UpdatePaymentDto } from './dto/update-payments.dto';
import { PaymentResponse, PaymentsResponse } from './interfaces/payments-response.interface';


@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
    ) {}

    async findAll(
        userId: number,
        role: string,
    ): Promise<PaymentsResponse> {

        const payments =
            role === 'ADMIN'
            ? await this.prisma.payment.findMany()
            : await this.prisma.payment.findMany({
                where: {
                    booking: {
                        userId: userId,
                    },
                },
            });

        return {
            message: `All payments retrieved successfully`,
            data: payments.map((payment) => ({
                ...payment,
                amount: Number(payment.amount),
            })),
        };
    }

    async findOne(
        id: number,
        userId: number,
        role: string
    ): Promise<PaymentResponse>{

        const payment = await this.prisma.payment.findUnique({
            where: {
                id,
            },
            include: {
                booking: {
                include: {
                    slot: {
                    include: {
                        station: true,
                    },
                    },
                },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (role !== 'ADMIN' && payment.booking.userId !== userId) {
            throw new ForbiddenException(
                'You are not allowed to access this payment',
            );
        }

        return {
            message: 'Payment retrieved successfully',
            data: {
            ...payment,
            amount: Number(payment.amount),
            },
        };
    }

    async findAdjustment(
        id: number,
        userId: number,
        role: string,
    ) {
        const adjustment =
            await this.prisma.bookingAdjustment.findUnique({
            where: {
                id,
            },
            include: {
                booking: {
                include: {
                    slot: {
                    include: {
                        station: true,
                    },
                    },
                },
                },
            },
            });

        if (!adjustment) {
            throw new NotFoundException(
            'Booking adjustment not found',
            );
        }

        if (
            role !== 'ADMIN' &&
            adjustment.booking.userId !== userId
        ) {
            throw new ForbiddenException(
            'You are not allowed to access this booking adjustment',
            );
        }

        return {
            message: 'Booking adjustment retrieved successfully',
            data: {
            ...adjustment,
            estimatedKwh: Number(adjustment.estimatedKwh),
            estimatedCost: Number(adjustment.estimatedCost),
            adjustmentAmount: Number(
                adjustment.adjustmentAmount,
            ),
            },
        };
    }

    async completeAdjustmentPayment(
        id: number,
        userId: number,
        role: string,
    ) {
        const adjustment =
            await this.prisma.bookingAdjustment.findUnique({
            where: {
                id,
            },
            include: {
                booking: true,
            },
            });

        if (!adjustment) {
            throw new NotFoundException(
            'Booking adjustment not found',
            );
        }

        if (
            role !== 'ADMIN' &&
            adjustment.booking.userId !== userId
        ) {
            throw new ForbiddenException(
            'You are not allowed to complete this additional payment',
            );
        }

        if (adjustment.status !== 'PENDING') {
            throw new ForbiddenException(
            'This booking adjustment is no longer pending',
            );
        }

        if (adjustment.paymentStatus === 'PAID') {
            throw new ForbiddenException(
            'This additional payment has already been completed',
            );
        }

        const transactionId =
            `VOLTRA-ADJ-${Date.now()}-${Math.floor(
            1000 + Math.random() * 9000,
            )}`;

        const [updatedAdjustment, updatedBooking] =
            await this.prisma.$transaction([
            this.prisma.bookingAdjustment.update({
                where: {
                id,
                },
                data: {
                paymentStatus: 'PAID',
                transactionId,
                status: 'COMPLETED',
                },
            }),

            this.prisma.booking.update({
                where: {
                id: adjustment.bookingId,
                },
                data: {
                slotId: adjustment.slotId,
                startTime: adjustment.startTime,
                endTime: adjustment.endTime,
                estimatedKwh: adjustment.estimatedKwh,
                estimatedCost: adjustment.estimatedCost,
                },
            }),
            ]);

        return {
            message:
            'Additional payment completed and booking updated successfully',
            data: {
            adjustment: {
                ...updatedAdjustment,
                estimatedKwh: Number(
                updatedAdjustment.estimatedKwh,
                ),
                estimatedCost: Number(
                updatedAdjustment.estimatedCost,
                ),
                adjustmentAmount: Number(
                updatedAdjustment.adjustmentAmount,
                ),
            },
            booking: updatedBooking,
            },
        };
    }

    async create(
        createPaymentDto: CreatePaymentDto,
        userId: number,
        role: string,
    ): Promise<PaymentResponse> {
        const transactionId = `VOLTRA-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000,)}`;

        const booking = await this.prisma.booking.findUnique({
            where: {
                id: createPaymentDto.bookingId,
            },
        });

        if (!booking) {
            throw new NotFoundException(
                `Booking with ID ${createPaymentDto.bookingId} was not found`,
            );
        }

        if (role !== 'ADMIN' && booking.userId !== userId) {
            throw new ForbiddenException(
                'You are not allowed to make a payment for this booking',
            );
        }

        if (booking.estimatedCost === null) {
            throw new ForbiddenException(
                'This booking does not have an estimated cost',
            );
        }

        const payment = await this.prisma.payment.create({
            data: {
                bookingId: createPaymentDto.bookingId,
                amount: booking.estimatedCost,
                paymentMethod: createPaymentDto.paymentMethod,
                transactionId,
            },
        });

        return {
            message: 'New payment created successfully',
            data: {
            ...payment,
            amount: Number(payment.amount),
            },
        };
    }

    async update(
        id: number,
        updatePaymentDto: UpdatePaymentDto,
        userId: number,
        role: string,
    ): Promise<PaymentResponse> {
        const payment = await this.prisma.payment.findUnique({
            where: {
            id,
            },
            include: {
            booking: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (role !== 'ADMIN' && payment.booking.userId !== userId) {
            throw new ForbiddenException(
            'You are not allowed to update this payment',
            );
        }

        const updatedPayment = await this.prisma.payment.update({
            where: {
            id,
            },
            data: {
            paymentMethod: updatePaymentDto.paymentMethod,
            },
        });

        return {
            message: 'Payment updated successfully',
            data: {
            ...updatedPayment,
            amount: Number(updatedPayment.amount),
            },
        };
    }

    async completePayment(
        id: number,
        userId: number,
        role: string,
    ): Promise<PaymentResponse> {
        const payment = await this.prisma.payment.findUnique({
            where: {
            id,
            },
            include: {
            booking: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (role !== 'ADMIN' && payment.booking.userId !== userId) {
            throw new ForbiddenException(
            'You are not allowed to complete this payment',
            );
        }

        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
            where: {
                id,
            },
            data: {
                status: 'PAID',
            },
            }),

            this.prisma.booking.update({
            where: {
                id: payment.bookingId,
            },
            data: {
                status: 'CONFIRMED',
            },
            }),
        ]);

        return {
            message: 'Payment completed successfully',
            data: {
            ...updatedPayment,
            amount: Number(updatedPayment.amount),
            },
        };
    }
    
    async remove(
        id: number,
        userId: number,
        role: string,
    ): Promise<PaymentResponse> {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id,
            },
            include: {
                booking: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (role !== 'ADMIN' && payment.booking.userId !== userId) {
            throw new ForbiddenException(
                'You are not allowed to delete this payment',
            );
        }

        const deletedPayment = await this.prisma.payment.delete({
            where: {
                id,
            },
        });

        return {
            message: 'Payment deleted successfully',
            data: {
            ...deletedPayment,
            amount: Number(deletedPayment.amount),
            },
        };
    } 
}
