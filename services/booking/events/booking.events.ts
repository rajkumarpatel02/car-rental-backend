import { EVENT_TYPES } from '../../../shared/events/eventTypes';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { CarService } from '../../car/services/car.service';
import { Booking } from '../../booking/models/Booking';
import { BookingService } from '../services/booking.service';


// Listens for responses from other services
export const setupBookingEventHandlers = async (): Promise<void> => {
  await rabbitMQ.connect();

  // STEP 7: Listen for car availability results
  await rabbitMQ.consumeQueue(EVENT_TYPES.CAR_AVAILABILITY_RESULT, async (message) => {
    const { bookingId, isAvailable, totalPrice, failureReason } = message;

    console.log(`Processing booking ${bookingId} , availabe : ${isAvailable}`);
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // STEP 8: Update booking status based on response
    if (isAvailable) {
      // Mark booking as available and set total price
      await Booking.findByIdAndUpdate(bookingId, { status: 'available', totalPrice });
      console.log(`Booking ${bookingId} updated to available, price: ${totalPrice}`)

    } else {
      // Mark booking as failed and record failure reason
      await Booking.findByIdAndUpdate(bookingId, { status: 'failed', failureReason });
      console.log(`Booking ${bookingId} failed : ${failureReason}`)
    }
  });
};