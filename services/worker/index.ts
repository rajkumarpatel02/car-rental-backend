import mongoose from 'mongoose';
import { rabbitMQ } from '../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../shared/events/eventTypes';

const startWorker = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27018/booking_db');
    console.log('✅ MongoDB Connected: booking_db');

    await rabbitMQ.connect();
    
    // Listen for user creation to send welcome email
    await rabbitMQ.consumeQueue(EVENT_TYPES.USER_CREATED, async (message) => {
      console.log('👷 Worker: Sending welcome email to:', message.email);
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Welcome email sent to:', message.email);
    });

    // Listen for booking creation
    await rabbitMQ.consumeQueue(EVENT_TYPES.BOOKING_CREATED, async (message) => {
      console.log('👷 Worker: Processing booking confirmation for:', message.bookingId);
      // Send booking confirmation email
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Booking confirmation sent for:', message.bookingId);
    });

    console.log('👷 Worker service started and listening for events...');
    
  } catch (error) {
    console.error('Failed to start worker service:', error);
    process.exit(1);
  }
};

startWorker();