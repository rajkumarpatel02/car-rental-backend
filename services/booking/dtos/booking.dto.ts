export interface CreateBookingDto {
  carId: string;
  startDate: string;
  endDate: string;
}

export interface BookingResponseDto {
  id: string;
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface BookingRequestDto {
  carId: string;
  startDate: Date;
  endDate: Date;
}