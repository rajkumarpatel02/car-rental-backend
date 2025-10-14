import express from 'express';
import mongoose from 'mongoose';
import { rabbitMQ } from '../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../shared/events/eventTypes';

const app = express();
const PORT = 3003;

app.use(express.json());

// Event listener for user creation
const setupEventListeners = async () => {
  await rabbitMQ.connect();
  
  // Listen for new users
  await rabbitMQ.consumeQueue(EVENT_TYPES.USER_CREATED, (message) => {
    console.log('📧 New user created:', message);
    // Send welcome email, create user profile, etc.
  });

  // Listen for new cars
  await rabbitMQ.consumeQueue(EVENT_TYPES.CAR_CREATED, (message) => {
    console.log('🚗 New car added:', message);
    // Update search index, send notifications, etc.
  });
};

app.get('/health', (req, res) => {
  res.json({ status: 'Booking service is running', port: PORT });
});

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27018/booking_db');
    console.log('✅ MongoDB Connected: booking_db');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  await setupEventListeners();
  app.listen(PORT, () => {
    console.log(`📅 Booking service running on port ${PORT}`);
  });
};

startServer();