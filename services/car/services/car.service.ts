import { Car } from '../models/Car';
import { RedisManager } from '../../../shared/redis/redis.config';

export class CarService {
  
  // Your existing checkCarAvailability method
  async checkCarAvailability(carId: string, startDate: Date, endDate: Date) {
    // Implementation of checkCarAvailability
    try {
      const car = await Car.findById(carId);
      if (!car) {
        return {
          isAvailable: false,
          car: null,
          totalPrice: 0,
          reason: 'Car not found'
        };
      }

      // Add your actual availability logic here
      const isAvailable = car.isAvailable === true;
      const totalPrice = this.calculatePrice(car.pricePerDay, startDate, endDate);

      return {
        isAvailable,
        car,
        totalPrice,
        reason: isAvailable ? '' : 'Car is not available'
      };
    } catch (error) {
      return {
        isAvailable: false,
        car: null,
        totalPrice: 0,
        reason: 'Error checking availability'
      };
    }
  }

  private calculatePrice(pricePerDay: number, startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return pricePerDay * days;
  }

  /**
   * Mark car as booked (unavailable)
   */
  async markCarAsBooked(carId: string): Promise<any> {
    try {
      const car = await Car.findByIdAndUpdate(
        carId,
        { isAvailable: false },
        { new: true }
      );
      
      if (!car) {
        throw new Error('Car not found');
      }

      // Clear car cache since availability changed
      await RedisManager.del(`car:${carId}`);
      
      console.log(`✅ Car ${carId} marked as booked`);
      return car;
    } catch (error) {
      console.error('❌ Error marking car as booked:', error);
      throw error;
    }
  }

  /**
   * Mark car as available
   */
  async markCarAsAvailable(carId: string): Promise<any> {
    try {
      const car = await Car.findByIdAndUpdate(
        carId,
        { isAvailable: true },
        { new: true }
      );
      
      if (!car) {
        throw new Error('Car not found');
      }

      // Clear car cache since availability changed
      await RedisManager.del(`car:${carId}`);
      
      console.log(`✅ Car ${carId} marked as available`);
      return car;
    } catch (error) {
      console.error('❌ Error marking car as available:', error);
      throw error;
    }
  }

  // Add other existing methods you have...
}