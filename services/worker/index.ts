import mongoose from 'mongoose';
import { rabbitMQ } from '../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../shared/events/eventTypes';

const startWorker = async () => {
  try {
    // await mongoose.connect('mongodb://127.0.0.1:27017/worker_db');
    // console.log('✅ MongoDB Connected: worker-db');

    console.log('👷 Worker: Connecting to RabbitMQ...');
    await rabbitMQ.connect();
    console.log('✅ Worker: Connected to RabbitMQ');

    // Listen for user creation to send welcome email
    console.log('👷 Worker: Setting up USER_CREATED listener...');
    

    //new consumers : for booking logic 

//     // Add to existing worker
// await rabbitMQ.consumeQueue(EVENT_TYPES.BOOKING_CONFIRMED, sendBookingEmail);
// await rabbitMQ.consumeQueue(EVENT_TYPES.BOOKING_CANCELLED, sendCancellationEmail);
// await rabbitMQ.consumeQueue(EVENT_TYPES.BOOKING_FAILED, sendFailureEmail);

    await rabbitMQ.consumeQueue(EVENT_TYPES.USER_CREATED, async (message) => {
      console.log('👷 Worker: RECEIVED USER_CREATED event for:', message.email);
      console.log('👷 Worker: Sending welcome email to:', message.email);
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Worker: Welcome email sent to:', message.email);
    });



    console.log('👷 Worker service started and listening for events...');
    
  } catch (error) {
    console.error('Failed to start worker service:', error);
    process.exit(1);
  }
};

startWorker();