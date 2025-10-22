import { Car } from '../models/Car';

export class CarService {
    async checkCarAvailability(carId: string, startDate: Date, endDate: Date) {
        console.log(`🔍 Checking availability for car ${carId} from ${startDate} to ${endDate}`);
        
        const car = await Car.findById(carId);
        if (!car) {
            console.log(`❌ Car ${carId} not found`);
            return {
                isAvailable: false,
                reason: 'Car not found'
            };
        }

        // Check if car is marked as available
        if (!car.isAvailable) {
            console.log(`❌ Car ${carId} is marked as unavailable`);
            return {
                isAvailable: false,
                reason: 'Car is currently not available for booking'
            };
        }

        // TODO: Check for existing bookings (will implement when booking service is ready)
        // For now, we'll assume no conflicts and calculate price
        
        const days = this.calculateDays(startDate, endDate);
        const totalPrice = days * car.pricePerDay;

        console.log(`✅ Car ${carId} is available. Price: ${totalPrice} for ${days} days`);

        return {
            isAvailable: true,
            car: {
                id: car._id,
                brand: car.brand,
                modelName: car.modelName,
                pricePerDay: car.pricePerDay
            },
            totalPrice,
            days,
            reason: null
        };
    }

    async markCarAsBooked(carId: string) {
        const car = await Car.findByIdAndUpdate(
            carId,
            { isAvailable: false },
            { new: true }
        );
        console.log(`🔒 Car ${carId} marked as booked`);
        return car;
    }

    async markCarAsAvailable(carId: string) {
        const car = await Car.findByIdAndUpdate(
            carId,
            { isAvailable: true },
            { new: true }
        );
        console.log(`🔓 Car ${carId} marked as available`);
        return car;
    }

    private calculateDays(startDate: Date, endDate: Date): number {
        const timeDiff = endDate.getTime() - startDate.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return days > 0 ? days : 1; // Minimum 1 day
    }

    // These will be implemented later when we have booking data
    private async getCarBookings(carId: string): Promise<any[]> {
        // TODO: Integrate with booking service to get existing bookings
        return [];
    }

    private checkDateConflict(existingBookings: any[], startDate: Date, endDate: Date): boolean {
        // TODO: Implement date conflict checking
        return false;
    }
}