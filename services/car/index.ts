import express from 'express';
import mongoose from 'mongoose';
import carRoutes from './routes/car.routes';

const app = express();
const PORT = 3002;

app.use(express.json());
app.use('/api/cars', carRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Car service is running', port: PORT });
});

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27018/car_db');
    console.log('✅ MongoDB Connected: car_db');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚗 Car service running on port ${PORT}`);
  });
};

startServer();