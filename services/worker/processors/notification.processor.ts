import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EXCHANGES, EVENT_TYPES } from '../../../shared/events/eventTypes';
import { RedisManager } from '../../../shared/redis/redis.config'; // Import RedisManager

export class NotificationProcessor {
  async initialize() {
    // console.log('🔔 Notification Processor: Initializing...');

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

    // console.log('✅ Notification Processor: Initialized and listening for events');
  }

  private async handleBookingEvent(message: any) {
    try {
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
        
        default:
          // console.log(`🔔 Notification Processor: Unhandled booking event: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Notification Processor: Error processing booking event:', error);
    }
  }

  private async handleCarEvent(message: any) {
    try {
      console.log(`🔔 Notification Processor: Received car event - ${message.type}`);
      
      switch (message.type) {
        case EVENT_TYPES.CAR_AVAILABILITY_RESULT:
          await this.handleCarAvailabilityResult(message.data);
          break;
        
        case EVENT_TYPES.CAR_UPDATED:
          await this.handleCarUpdated(message.data);
          break;
        
        default:
          // console.log(`🔔 Notification Processor: Unhandled car event: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Notification Processor: Error processing car event:', error);
    }
  }

  private async handleBookingCreated(bookingData: any) {
    console.log(`🔔 Booking created notification: ${bookingData.bookingId}`);
    
    // Cache booking data for quick access
    await RedisManager.cacheBooking(bookingData.bookingId, bookingData);
    
    // TODO: Send push notification, in-app notification, etc.
  }

  private async handleBookingConfirmed(bookingData: any) {
    console.log(`🔔 Booking confirmed notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'confirmed',
      updatedAt: new Date()
    });
    
    // TODO: Send confirmation notification
  }

  private async handleBookingCancelled(bookingData: any) {
    console.log(`🔔 Booking cancelled notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'cancelled',
      updatedAt: new Date()
    });
    
    // TODO: Send cancellation notification
  }

  private async handleBookingFailed(bookingData: any) {
    console.log(`🔔 Booking failed notification: ${bookingData.bookingId}`);
    
    // Update cached booking data
    await RedisManager.cacheBooking(bookingData.bookingId, {
      ...bookingData,
      status: 'failed',
      updatedAt: new Date()
    });
    
    // TODO: Send failure notification
  }

  private async handleCarAvailabilityResult(availabilityData: any) {
    console.log(`🔔 Car availability result: ${availabilityData.bookingId} - ${availabilityData.isAvailable ? 'Available' : 'Not Available'}`);
    
    // Cache availability result using standard set method
    const cacheKey = `availability_result:${availabilityData.bookingId}`;
    await RedisManager.set(cacheKey, availabilityData, 300); // 5 minutes cache
    
    // TODO: Send real-time notification to user about availability
  }

  private async handleCarUpdated(carData: any) {
    console.log(`🔔 Car updated notification: ${carData.carId}`);
    
    // Clear cached car data using standard del method
    await RedisManager.del(`car:${carData.carId}`);
    
    // TODO: Notify users who have upcoming bookings for this car
  }
}