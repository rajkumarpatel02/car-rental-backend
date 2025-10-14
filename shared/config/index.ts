export const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
};