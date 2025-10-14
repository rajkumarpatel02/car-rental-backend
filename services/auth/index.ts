import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';

const app = express();
const PORT = 3001;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Auth service is running', port: PORT });
});

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/auth_db');
    console.log('✅ MongoDB Connected: auth_db');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Auth service running on port ${PORT}`);
  });
};

startServer();