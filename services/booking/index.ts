import express from 'express';
import mongoose from 'mongoose';
import bookingRoutes from './routes/booking.routes';

const app = express();
const PORT = 3003;

app.use(express.json());
app.use('/api/bookings', bookingRoutes);

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
  app.listen(PORT, () => {
    console.log(`📅 Booking service running on port ${PORT}`);
  });
};

startServer();