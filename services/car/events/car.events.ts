import { CarService } from '../services/car.service';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../../shared/events/eventTypes';

const carService = new CarService();

export const setupCarEventHandlers = async (): Promise<void> => {
  try {
    await rabbitMQ.connect();
    console.log('🚗 Car Service: Connected to RabbitMQ');

    // Use the new getChannel method
    const channel = await rabbitMQ.getChannel();
    
    // Listen for car availability requests from Booking Service
   await channel.consume(EVENT_TYPES.CAR_AVAILABILITY_REQUEST, async (msg) => {
  if (msg !== null) {
    let bookingId: string;
    
    try {
      const message = JSON.parse(msg.content.toString());
      console.log('🚗 Car Service: Received availability request', message);
      
      // Extract variables
      bookingId = message.bookingId;
      const { carId, startDate, endDate, userId } = message;
      
      // ... rest of your try block code
      console.log(`checking car availability request for car ${carId}, booking ${bookingId}`)
      
      // checking availability using existing service 

      const availablityResult = await carService.checkCarAvailability( 
        carId, 
        new Date(startDate), 
        new Date(endDate)
      )
      console.log(`available result for car ${carId} :` , availablityResult);

      //send response back to booking service. 
      await rabbitMQ.sendToQueue(EVENT_TYPES.CAR_AVAILABILITY_RESULT, {
        bookingId, 
        isAvailable: availablityResult.isAvailable, 
        carDate: availablityResult.car, 
        totalPrice: availablityResult.totalPrice, 
        failureReason : availablityResult.reason
      }); 

      console.log(`availability result sent for booking ${bookingId} : ${availablityResult.isAvailable ? 'Available ': 'Not Available'}`)
      // Acknoledge the message AFTER Processing.
      channel.ack(msg);

    } catch (error) {
      console.error('❌ Error processing car availability request:', error);
      
      // Send error response back to Booking Service
      await rabbitMQ.sendToQueue(EVENT_TYPES.CAR_AVAILABILITY_RESULT, {
        bookingId: bookingId!,  // ✅ Now bookingId is accessible
        isAvailable: false,
        failureReason: 'Internal server error checking availability'
      });

      // Acknowledge even on error to prevent redelivery
      channel.ack(msg);
    }
  }
});

    console.log(`✅ Car Service: Listening to queue ${EVENT_TYPES.CAR_AVAILABILITY_REQUEST}`);

  } catch (error) {
    console.error('❌ Failed to setup car service event handlers:', error);
    throw error;
  }
};