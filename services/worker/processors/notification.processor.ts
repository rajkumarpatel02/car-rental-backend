import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EXCHANGES, EVENT_TYPES } from '../../../shared/events/eventTypes';
import { RedisManager } from '../../../shared/redis/redis.config';

interface BookingData {
  bookingId: string;
  status?: string;
  updatedAt?: Date;
}

interface CarAvailabilityData {
  bookingId: string;
  isAvailable: boolean;
}

interface CarData {
  carId: string;
}

export class NotificationProcessor {
  async initialize(): Promise<void> {
    // Subscribe to booking events for notifications
    await exchangeManager.subscribeToExchange(
      EXCHANGES.BOOKING,
      'notification_processor',
      this.handleBookingEvent.bind(this)
    );

    // Subscribe to car events for availability notifications
    await exchangeManager.subscribeToExchange(
      EXCHANGES.CAR,
      'notification_processor_car',
      this.handleCarEvent.bind(this)
    );
  }

  private async handleBookingEvent(message: any): Promise<void> {
    try {
      const messageId = this.getMessageId(message);
      if (await this.isDuplicate(messageId)) return;

      console.log(`🔔 Notification Processor: Received booking event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.BOOKING_CREATED:
          await this.handleBookingCreated(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_CONFIRMED:
          await this.handleBookingConfirmed(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_CANCELLED:
          await this.handleBookingCancelled(message.data);
          break;
        
        case EVENT_TYPES.BOOKING_FAILED:
          await this.handleBookingFailed(message.data);
          break;
      }
    } catch (error) {
      console.error('❌ Notification Processor: Error processing booking event:', error);
    }
  }

  private async handleCarEvent(message: any): Promise<void> {
    try {
      const messageId = this.getMessageId(message);
      if (await this.isDuplicate(messageId)) return;

      console.log(`🔔 Notification Processor: Received car event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.CAR_AVAILABILITY_RESULT:
          await this.handleCarAvailabilityResult(message.data);
          break;
        
        case EVENT_TYPES.CAR_UPDATED:
          await this.handleCarUpdated(message.data);
          break;
      }
    } catch (error) {
      console.error('❌ Notification Processor: Error processing car event:', error);
    }
  }

  private async handleBookingCreated(bookingData: BookingData): Promise<void> {
    console.log(`🔔 Booking created notification: ${bookingData.bookingId}`);
    
    // Cache booking data for quick access
    await RedisManager.cacheBooking(bookingData.bookingId, bookingData);
  }

  private async handleBookingConfirmed(bookingData: BookingData): Promise<void> {
    console.log(`🔔 Booking confirmed notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'confirmed',
      updatedAt: new Date()
    });
  }

  private async handleBookingCancelled(bookingData: BookingData): Promise<void> {
    console.log(`🔔 Booking cancelled notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'cancelled',
      updatedAt: new Date()
    });
  }

  private async handleBookingFailed(bookingData: BookingData): Promise<void> {
    console.log(`🔔 Booking failed notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'failed',
      updatedAt: new Date()
    });
  }

  private async handleCarAvailabilityResult(availabilityData: CarAvailabilityData): Promise<void> {
    console.log(`🔔 Car availability result: ${availabilityData.bookingId} - ${availabilityData.isAvailable ? 'Available' : 'Not Available'}`);
    
    // Cache availability result using standard set method
    const cacheKey = `availability_result:${availabilityData.bookingId}`;
    await RedisManager.set(cacheKey, availabilityData, 300); // 5 minutes cache
  }

  private async handleCarUpdated(carData: CarData): Promise<void> {
    console.log(`🔔 Car updated notification: ${carData.carId}`);
    
    // Clear cached car data using standard del method
    await RedisManager.del(`car:${carData.carId}`);
  }

  private getMessageId(message: any): string {
    return `${message.type}-${message.data?.bookingId || message.data?.carId || Date.now()}`;
  }

  private async isDuplicate(messageId: string): Promise<boolean> {
    const key = `notification_processed:${messageId}`;
    const isDuplicate = await RedisManager.exists(key);
    
    if (!isDuplicate) {
      await RedisManager.set(key, 'true', 3600); // 1 hour TTL
      return false;
    }
    
    console.log(`🔄 Skipping duplicate notification message: ${messageId}`);
    return true;
  }
}