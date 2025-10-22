import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EVENT_TYPES, EXCHANGES } from '../../../shared/events/eventTypes';
import { BookingService } from '../services/booking.service';

const bookingService = new BookingService();


export const setupBookingEventHandlers = async (): Promise<void> => {
  try {
    await exchangeManager.connect();
    console.log('📖 Booking Service: Connected to RabbitMQ exchanges');

    // Subscribe to car events for availability responses
    await exchangeManager.subscribeToExchange(
      EXCHANGES.CAR,
      'booking_service_car',
      async (message) => {
        if (message.type === EVENT_TYPES.CAR_AVAILABILITY_RESULT) {
          await handleCarAvailabilityResponse(message.data);
        }
      }
    );

    console.log('✅ Booking Service: Listening to car events exchange');

  } catch (error) {
    console.error('❌ Failed to setup booking service event handlers:', error);
    throw error;
  }
};

async function handleCarAvailabilityResponse(availabilityData: any) {
  const { bookingId, isAvailable, totalPrice, failureReason } = availabilityData;
  
  console.log(`📖 Booking Service: Received availability response for booking ${bookingId}`);
  
  try {
    await bookingService.handleCarAvailabilityResponse({
      bookingId,
      isAvailable,
      totalPrice,
      failureReason
    });
    
    console.log(`✅ Booking ${bookingId} updated to: ${isAvailable ? 'confirmed' : 'failed'}`);
    
  } catch (error) {
    console.error(`❌ Error updating booking ${bookingId}:`, error);
  }
}