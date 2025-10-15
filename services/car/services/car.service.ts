import { Car } from '../models/Car';

export class CarService {
    async checkCarAvailability(carId: string, startDate: Date, endDate: Date) {
        const car = await Car.findById(carId);
        if (!car) {
            throw new Error('Car not found');
        }

        if (!car.isAvailable) {
            return {
                isAvailable: false,
                reason: 'Car is currently not available'
            };
        }

        // Check if car is already booked for these dates
        const existingBookings = await this.getCarBookings(carId);
        const hasConflict = this.checkDateConflict(existingBookings, startDate, endDate);

        if (hasConflict) {
            return {
                isAvailable: false,
                reason: 'Car is already booked for the selected dates'
            };
        }

        // Calculate price
        const days = this.calculateDays(startDate, endDate);
        const totalPrice = days * car.pricePerDay;

        return {
            isAvailable: true,
            car: {
                id: car._id,
                make: car.brand,
                medelName: car.model,
                pricePerDay: car.pricePerDay
            },
            totalPrice,
            days
        };
    }

    async markCarAsBooked(carId: string) {
        const car = await Car.findByIdAndUpdate(
            carId,
            { isAvailable: false },
            { new: true }
        );
        return car;
    }

    async markCarAsAvailable(carId: string) {
        const car = await Car.findByIdAndUpdate(
            carId,
            { isAvailable: true },
            { new: true }
        );
        return car;
    }

    private calculateDays(startDate: Date, endDate: Date): number {
        const timeDiff = endDate.getTime() - startDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    private async getCarBookings(carId: string): Promise<any[]> {
        // This will be implemented when Booking Service is ready
        // For now, return empty array (no conflict checking)
        return [];
    }

    private checkDateConflict(existingBookings: any[], startDate: Date, endDate: Date): boolean {
        // This will be implemented when Booking Service is ready
        // For now, return false (no conflicts)
        return false;
    }
}