import { BookingStatus } from '../../generated/prisma/browser';
import { Decimal } from '@prisma/client/runtime/client';

export interface Booking {
    id: number;
    userId: number;
    slotId: number;
    bookingCode: string;
    startTime: Date;
    endTime: Date;
    estimatedKwh: Decimal | null;
    estimatedCost: Decimal | null;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
}