import { Booking } from './bookings.interface';

export interface BookingResponse {
    message: string;
    data: Booking & {
      netPaidAmount?: number;
    };

    paymentAdjustment?: {
    type:
      | "ADDITIONAL_PAYMENT"
      | "REFUND"
      | "NO_CHANGE";

    previousAmount: number;
    newAmount: number;
    amount: number;
    adjustmentId?: number;
  };
}

export interface BookingsResponse {
  message: string;
  data: Booking[];
}