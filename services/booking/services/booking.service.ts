import { Booking } from '../models/Booking';
import { CreateBookingDto, BookingResponseDto } from '../dtos/booking.dto';

export class BookingService {
  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
  console.log('🔍 Creating booking for user:', userId);
  
  const booking = await Booking.create({
    userId,
    carId: createBookingDto.carId,
    startDate: new Date(createBookingDto.startDate),
    endDate: new Date(createBookingDto.endDate),
    totalPrice: 250,
    status: 'pending',
    paymentStatus: 'pending'
  });
  
  console.log('✅ Booking saved to MongoDB:', booking._id);
  return this.mapToBookingResponse(booking);
}

  async getUserBookings(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    return bookings.map(booking => this.mapToBookingResponse(booking));
  }

  async getBookingById(bookingId: string, userId: string): Promise<BookingResponseDto> {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      throw new Error('Booking not found');
    }
    return this.mapToBookingResponse(booking);
  }

  private calculatePrice(startDate: string, endDate: string, pricePerDay: number): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return days * pricePerDay;
  }

  private mapToBookingResponse(booking: any): BookingResponseDto {
    return {
      id: booking._id.toString(),
      userId: booking.userId,
      carId: booking.carId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt
    };
  }
}