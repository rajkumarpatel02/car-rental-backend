import { CarService } from '../services/car.service';
import { exchangeManager } from '../../../shared/rabbitmq/exchange.config';
import { EVENT_TYPES, EXCHANGES } from '../../../shared/events/eventTypes';
import { RedisManager } from '../../../shared/redis/redis.config';

const carService = new CarService();

export const setupCarEventHandlers = async (): Promise<void> => {
  try {
    await exchangeManager.connect();
    console.log('🚗 Car Service: Connected to RabbitMQ exchanges');

    // Subscribe to booking events for availability requests
    await exchangeManager.subscribeToExchange(
      EXCHANGES.BOOKING,
      'car_service_bookings',
      async (message) => {
        if (message.type === EVENT_TYPES.BOOKING_CREATED) {
          await handleCarAvailabilityRequest(message.data);
        }
      }
    );

    console.log('✅ Car Service: Listening to booking events exchange');

  } catch (error) {
    console.error('❌ Failed to setup car service event handlers:', error);
    throw error;
  }
};

async function handleCarAvailabilityRequest(bookingData: any) {
  const { bookingId, carId, startDate, endDate, userId } = bookingData;
  
  console.log(`🚗 Car Service: Received availability request for car ${carId}, booking ${bookingId}`);
  
  try {
    // Check cache first for availability
    const dateRange = `${startDate}-${endDate}`;
    const cachedAvailability = await RedisManager.getCachedCarAvailability(carId, dateRange);
    
    let availabilityResult;
    
    if (cachedAvailability) {
      console.log(`✅ Returning cached availability for car ${carId}`);
      availabilityResult = cachedAvailability;
    } else {
      // Check availability using existing service
      availabilityResult = await carService.checkCarAvailability(
        carId,
        new Date(startDate),
        new Date(endDate)
      );
      
      // Cache the availability result for 30 minutes
      await RedisManager.cacheCarAvailability(carId, dateRange, availabilityResult, 1800);
    }

    console.log(`✅ Availability result for car ${carId}:`, availabilityResult);

    // Send response back via CAR exchange (Pub/Sub)
    await exchangeManager.publishToExchange(EXCHANGES.CAR, {
      type: EVENT_TYPES.CAR_AVAILABILITY_RESULT,
      data: {
        bookingId,
        isAvailable: availabilityResult.isAvailable,
        carData: availabilityResult.car,
        totalPrice: availabilityResult.totalPrice,
        failureReason: availabilityResult.reason
      },
      timestamp: new Date()
    });

    console.log(`✅ Availability result sent for booking ${bookingId}: ${availabilityResult.isAvailable ? 'Available' : 'Not Available'}`);

  } catch (error) {
    console.error('❌ Error processing car availability request:', error);
    
    // Send error response back via CAR exchange
    await exchangeManager.publishToExchange(EXCHANGES.CAR, {
      type: EVENT_TYPES.CAR_AVAILABILITY_RESULT,
      data: {
        bookingId,
        isAvailable: false,
        failureReason: 'Internal server error checking availability'
      },
      timestamp: new Date()
    });
  }
}