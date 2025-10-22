

export const config = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
};