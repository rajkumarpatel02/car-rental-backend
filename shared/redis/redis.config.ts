import Redis from 'ioredis';

export class RedisManager {
  private static instance: Redis;
  
  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        lazyConnect: true
      });

      this.instance.on('error', (error) => {
        console.error('❌ Redis error:', error);
      });

      this.instance.on('connect', () => {
        console.log('✅ Connected to Redis successfully');
      });
    }
    
    return this.instance;
  }

  static async set(key: string, value: any, expiry?: number): Promise<void> {
    const redis = this.getInstance();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (expiry) {
      await redis.setex(key, expiry, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  }

  static async get(key: string): Promise<any> {
    const redis = this.getInstance();
    const value = await redis.get(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  static async del(key: string): Promise<void> {
    const redis = this.getInstance();
    await redis.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const redis = this.getInstance();
    const result = await redis.exists(key);
    return result === 1;
  }

  static async cacheBooking(bookingId: string, bookingData: any, ttl: number = 3600): Promise<void> {
    await this.set(`booking:${bookingId}`, bookingData, ttl);
  }

  static async getCachedBooking(bookingId: string): Promise<any> {
    return await this.get(`booking:${bookingId}`);
  }

  static async cacheCarAvailability(carId: string, dateRange: string, result: any, ttl: number = 1800): Promise<void> {
    await this.set(`car_availability:${carId}:${dateRange}`, result, ttl);
  }

  static async getCachedCarAvailability(carId: string, dateRange: string): Promise<any> {
    return await this.get(`car_availability:${carId}:${dateRange}`);
  }

  static async clearUserCache(userId: string): Promise<void> {
    const userBookingsKey = `user_bookings:${userId}`;
    await this.del(userBookingsKey);
  }
}

export const redisManager = RedisManager.getInstance();