import { 
    ForbiddenException,
    Injectable,
    NotFoundException
 } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { BookingResponse } from './interfaces/bookings-response.interface';
import { BookingsResponse } from './interfaces/bookings-response.interface';
import { PaymentCalculatorService } from '../payments/payment-calculator.service';

@Injectable()
export class BookingsService {
    constructor(
        private prisma: PrismaService,
        private paymentCalculator: PaymentCalculatorService,
    ) {}

    async findAll(
        userId: number,
        role: string
    ): Promise<BookingsResponse> {
        const bookings =
            role === 'ADMIN'
                ? await this.prisma.booking.findMany({
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                    },
                    slot: {
                        include: {
                            station: true,
                        },
                    },
                    payment: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }) : await this.prisma.booking.findMany({
                    where: {
                        userId: userId,
                    },
                    include: {
                        slot: {
                            include: {
                                station: true,
                            },
                        },
                    payment: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

        return {
            message: 'Bookings retrieved successfully',
            data: bookings,
        };
    }

    async findOne(
        id: number,
        userId: number,
        role: string
    ): Promise<BookingResponse> {

        const booking = await this.prisma.booking.findUnique({
            where: {
                id,
            },
            include: {
                slot: {
                    include: {
                        station: true,
                    },
                },
                payment: true,
            },
        });

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} was not found`);
        }

        if (role !== 'ADMIN' && booking.userId !== userId) {
            throw new ForbiddenException(
            'You are not allowed to access this booking',
            );
        }

        return {
            message: `Booking ID ${id} retrieved successfully`,
            data: booking,
        };
    }

    async create(
        createBookingDto: CreateBookingDto,
        userId: number,
    ): Promise<BookingResponse> {
        const startTime = new Date(createBookingDto.startTime);

        const endTime = new Date(
            startTime.getTime() +
            createBookingDto.durationMinutes * 60 * 1000,
        );

        // Get the selected charging slot
        const slot = await this.prisma.chargingSlot.findUnique({
            where: {
                id: createBookingDto.slotId,
            },
        });

        if (!slot) {
            throw new NotFoundException(
                `Charging slot with ID ${createBookingDto.slotId} was not found`,
            );
        }

        // Calculate estimated energy and cost
        const calculation = this.paymentCalculator.calculate(
            Number(slot.powerKw),
            createBookingDto.durationMinutes,
            Number(slot.pricePerKwh),
        );

        const booking = await this.prisma.booking.create({
            data: {
                userId: userId,
                slotId: createBookingDto.slotId,
                bookingCode: `BOOK-${Date.now()}`,
                startTime: startTime,
                endTime: endTime,
                estimatedKwh: calculation.estimatedKwh,
                estimatedCost: calculation.estimatedCost,
                status: "PENDING",
            },
        });

        return {
            message: 'New booking created successfully',
            data: booking,
        };
    }

    async update(
        id: number,
        updateBookingDto: UpdateBookingDto,
        userId: number,
        role: string
    ): Promise<BookingResponse> {
        const existingBookingResponse = await this.findOne(
            id,
            userId,
            role
        );

        const existingBooking = existingBookingResponse.data;

        const existingPayment = await this.prisma.payment.findUnique({
            where: {
                bookingId: id,
            },
        });

        const {
            startTime,
            durationMinutes,
            slotId,
            status,
        } = updateBookingDto;

        const data: any = {};

        if (slotId !== undefined) {
            data.slotId = slotId;
        }

        if (status !== undefined) {
            data.status = status;
        }

        if (startTime !== undefined || durationMinutes !== undefined) {
            const newStartTime = startTime
            ? new Date(startTime)
            : new Date(existingBooking.startTime);

            const currentDurationMinutes =
            (new Date(existingBooking.endTime).getTime() -
                new Date(existingBooking.startTime).getTime()) /
            (60 * 1000);

            const newDurationMinutes =
            durationMinutes ?? currentDurationMinutes;

            const newEndTime = new Date(
            newStartTime.getTime() +
                newDurationMinutes * 60 * 1000
            );

            data.startTime = newStartTime;
            data.endTime = newEndTime;
        }

        const finalSlotId = slotId ?? existingBooking.slotId;

        const finalDurationMinutes =
        durationMinutes ??
        (
            new Date(existingBooking.endTime).getTime() -
            new Date(existingBooking.startTime).getTime()
        ) /
            (60 * 1000);

        const selectedSlot =
            await this.prisma.chargingSlot.findUnique({
                where: {
                    id: finalSlotId,
                },
        });

        if (!selectedSlot) {
            throw new NotFoundException(
                `Charging slot ID ${finalSlotId} not found`,
            );
        }

        const estimatedKwh = Number(selectedSlot.powerKw) * (finalDurationMinutes / 60);

        const estimatedCost = estimatedKwh * Number(selectedSlot.pricePerKwh);

        data.estimatedKwh = estimatedKwh;
        data.estimatedCost = estimatedCost;

        const paidAmount = existingPayment?.status === "PAID"
            ? Number(existingPayment.amount)
            : 0;

        const priceDifference = estimatedCost - paidAmount;

        if (existingPayment?.status === "PAID" && priceDifference > 0) {
            const proposedStartTime =
                data.startTime ?? new Date(existingBooking.startTime);

            const proposedEndTime =
                data.endTime ?? new Date(existingBooking.endTime);

            await this.prisma.bookingAdjustment.updateMany({
                where: {
                bookingId: id,
                status: "PENDING",
                },
                data: {
                status: "CANCELLED",
                },
            });

            const adjustment =
                await this.prisma.bookingAdjustment.create({
                data: {
                    bookingId: id,
                    slotId: finalSlotId,
                    startTime: proposedStartTime,
                    endTime: proposedEndTime,
                    estimatedKwh,
                    estimatedCost,
                    adjustmentAmount: priceDifference,
                    status: "PENDING",
                },
                });

            return {
                message: "Additional payment required",
                data: existingBooking,
                paymentAdjustment: {
                type: "ADDITIONAL_PAYMENT",
                previousAmount: paidAmount,
                newAmount: estimatedCost,
                amount: priceDifference,
                adjustmentId: adjustment.id,
                },
            };
        }

        if (existingPayment?.status === "PAID" && priceDifference < 0) {
            const refundAmount = Math.abs(priceDifference);

            const [updatedBooking] = await this.prisma.$transaction([
                this.prisma.booking.update({
                    where: {
                        id,
                    },
                    data,
                }),

                this.prisma.payment.update({
                    where: {
                        bookingId: id,
                    },
                    data: {
                        amount: estimatedCost,
                    },
                }),
            ]);

            return {
                message: "Booking updated and refund processed successfully.",
                data: updatedBooking,
                paymentAdjustment: {
                    type: "REFUND",
                    previousAmount: paidAmount,
                    newAmount: estimatedCost,
                    amount: refundAmount,
                },
            };
        }

        if (existingPayment?.status === "PAID" && priceDifference === 0) {
            const updatedBooking = await this.prisma.booking.update({
                where: {
                    id,
                },
                data,
            });

            return {
                message: "Booking updated successfully. No payment adjustment required.",
                data: updatedBooking,
                paymentAdjustment: {
                    type: "NO_CHANGE",
                    previousAmount: paidAmount,
                    newAmount: estimatedCost,
                    amount: 0,
                },
            };
        }

        const updatedBooking = await this.prisma.booking.update({
            where: {
                id,
            },
            data,
        });

        return {
            message: `Booking ID ${id} updated successfully`,
            data: updatedBooking,
        };
    }

    async remove(
        id: number,
        userId: number,
        role: string
    ): Promise<BookingResponse> {
        await this.findOne(id, userId, role);

        const deletedBooking = await this.prisma.booking.delete({
            where: {
                id,
            },
        });
        
        return {
            message: `Booking ID ${id} was deleted successfully`,
            data: deletedBooking,
        };
    }
}