import { Booking } from '../models/Booking';
import { CreateBookingDto, BookingResponseDto } from '../dtos/booking.dto';

export class BookingService {
  async createBooking(createBookingDto: CreateBookingDto, userId: string): Promise<BookingResponseDto> {
    const { carId, startDate, endDate } = createBookingDto;

    // For now, create booking without validation
    // We'll add car availability check later
    const totalPrice = this.calculatePrice(startDate, endDate, 50); // Default $50/day

    const booking = await Booking.create({
      userId,
      carId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending'
    });

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