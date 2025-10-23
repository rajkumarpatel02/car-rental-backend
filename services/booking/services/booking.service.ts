import { Booking } from '../../booking/models/Booking';
import { CreateBookingDto } from '../../booking/dtos/booking.dto';
import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EVENT_TYPES, EXCHANGES } from '../../../shared/events/eventTypes';
import { RedisManager } from '../../../shared/redis/redis.config'; // Import RedisManager instead of redisManager

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

    // Cache the booking using static method
    await RedisManager.cacheBooking(booking._id.toString(), booking);

    // STEP 3: Send availability request via EXCHANGE (Pub/Sub)
    await exchangeManager.publishToExchange(EXCHANGES.BOOKING, {
      type: EVENT_TYPES.BOOKING_CREATED,
      data: {
        bookingId: booking._id.toString(),
        carId: createBookingDto.carId,
        startDate: createBookingDto.startDate,
        endDate: createBookingDto.endDate,
        userId
      },
      timestamp: new Date()
    });

    console.log(`✅ Booking created and event published: ${booking._id}`);

    return this.mapToBookingResponse(booking);
  }

  // STEP 9: Get user bookings with Redis caching
  async getUserBookings(userId: string) {
    const cacheKey = `user_bookings:${userId}`;
    
    // Try to get from cache first
    const cachedBookings = await RedisManager.get(cacheKey);
    if (cachedBookings) {
      // console.log(`✅ Returning cached bookings for user: ${userId}`);
      return cachedBookings;
    }

    // If not in cache, fetch from database
    const bookings = await Booking.find({ userId });
    const response = bookings.map(booking => this.mapToBookingResponse(booking));
    
    // Cache for 5 minutes
    await RedisManager.set(cacheKey, response, 300);
    
    return response;
  }

  // STEP 9: Get single booking with Redis caching
  async getBookingById(bookingId: string, userId: string) {
    // Try to get from cache first
    const cachedBooking = await RedisManager.getCachedBooking(bookingId);
    if (cachedBooking && cachedBooking.userId === userId) {
      // console.log(`✅ Returning cached booking: ${bookingId}`);
      return this.mapToBookingResponse(cachedBooking);
    }

    // If not in cache, fetch from database
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (booking) {
      // Cache the booking
      await RedisManager.cacheBooking(bookingId, booking);
    }
    
    return booking ? this.mapToBookingResponse(booking) : null;
  }

  // STEP 8: Update booking status when car service responds
  async updateBookingStatus(bookingId: string, status: string, totalPrice?: number) {
    const updateData: any = { status };
    if (totalPrice) updateData.totalPrice = totalPrice;
    
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
    
    if (updatedBooking) {
      // Update cache
      await RedisManager.cacheBooking(bookingId, updatedBooking);
      
      // Clear user bookings cache using the new method
      await RedisManager.clearUserCache(updatedBooking.userId);
      
      // Publish booking status update event
      await exchangeManager.publishToExchange(EXCHANGES.BOOKING, {
        type: status === 'confirmed' ? EVENT_TYPES.BOOKING_CONFIRMED : 
              status === 'cancelled' ? EVENT_TYPES.BOOKING_CANCELLED : EVENT_TYPES.BOOKING_FAILED,
        data: {
          bookingId: updatedBooking._id.toString(),
          userId: updatedBooking.userId,
          status: updatedBooking.status,
          totalPrice: updatedBooking.totalPrice
        },
        timestamp: new Date()
      });
    }
    
    return updatedBooking;
  }

  // New method to handle car availability responses
  async handleCarAvailabilityResponse(availabilityData: any) {
    const { bookingId, isAvailable, totalPrice, failureReason } = availabilityData;
    
    if (isAvailable) {
      // Update booking to confirmed status
      await this.updateBookingStatus(bookingId, 'confirmed', totalPrice);
      
      // Publish booking confirmed event
      await exchangeManager.publishToExchange(EXCHANGES.BOOKING, {
        type: EVENT_TYPES.BOOKING_CONFIRMED,
        data: {
          bookingId,
          status: 'confirmed',
          totalPrice
        },
        timestamp: new Date()
      });
    } else {
      // Update booking to failed status
      await this.updateBookingStatus(bookingId, 'failed');
      
      // Publish booking failed event
      await exchangeManager.publishToExchange(EXCHANGES.BOOKING, {
        type: EVENT_TYPES.BOOKING_FAILED,
        data: {
          bookingId,
          status: 'failed',
          failureReason
        },
        timestamp: new Date()
      });
    }
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
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }
}