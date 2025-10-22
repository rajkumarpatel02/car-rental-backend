import { Booking } from '../../booking/models/Booking';
import { CreateBookingDto } from '../../booking/dtos/booking.dto';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../../shared/events/eventTypes';

// Contains all booking business logic
export class BookingService {
  
  // STEP 2: Create booking with "pending" status
  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const booking = await Booking.create({
      userId,
      carId: createBookingDto.carId,
      startDate: new Date(createBookingDto.startDate),
      endDate: new Date(createBookingDto.endDate),
      totalPrice: 0,
      status: 'pending', // IMMEDIATE STATUS
      paymentStatus: 'pending'
    });

    // STEP 3: Send availability request
    await rabbitMQ.sendToQueue(EVENT_TYPES.CAR_AVAILABILITY_REQUEST, {
      bookingId: booking._id.toString(),
      carId: createBookingDto.carId,
      startDate: createBookingDto.startDate,
      endDate: createBookingDto.endDate,
      userId
    });

    return this.mapToBookingResponse(booking);
  }

  // STEP 9: Get user bookings
  async getUserBookings(userId: string) {
    return await Booking.find({ userId });
  }

  // STEP 9: Get single booking
  async getBookingById(bookingId: string, userId: string) {
    return await Booking.findOne({ _id: bookingId, userId });
  }

  // STEP 8: Update booking status when car service responds
  async updateBookingStatus(bookingId: string, status: string, totalPrice?: number) {
    const updateData: any = { status };
    if (totalPrice) updateData.totalPrice = totalPrice;
    
    return await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
  }

  private mapToBookingResponse(booking: any) {
    return {
      id: booking._id,
      userId: booking.userId,
      carId: booking.carId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus
    };
  }
}