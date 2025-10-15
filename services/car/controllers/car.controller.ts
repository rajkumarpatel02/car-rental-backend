import { Request, Response } from 'express';
import { Car } from '../models/Car';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../../shared/events/eventTypes';

import { CarService } from '../services/car.service';

export const getCars = async (req: Request, res: Response) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cars', error });
  }
};

export const getCarById = async (req: Request, res: Response) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching car', error });
  }
};

export const createCar = async (req: Request, res: Response) => {
  try {
    const car = new Car(req.body);
    await car.save();

    // Emit event
    await rabbitMQ.connect();
    await rabbitMQ.sendToQueue(EVENT_TYPES.CAR_CREATED, {
      carId: car._id,
      make: car.brand,
      medelName: car.modelName,
      pricePerDay: car.pricePerDay,
      timestamp: new Date()
    });

    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: 'Error creating car', error });
  }
};

export const updateCar = async (req: Request, res: Response) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(400).json({ message: 'Error updating car', error });
  }
};

export const deleteCar = async (req: Request, res: Response) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting car', error });
  }
};

export const getAvailableCars = async (req: Request, res: Response) => {
  try {
    const cars = await Car.find({ isAvailable: true });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available cars', error });
  }
};

//new code for bookings logic 

const carService = new CarService();

export const checkCarAvailability = async (req: Request, res: Response) => {
  try {
    const { carId, startDate, endDate } = req.body;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Missing required fields: carId, startDate, endDate'
      });
    }

    const result = await carService.checkCarAvailability(
      carId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(result);
  } catch (error: any) {
    if (error.message === 'Car not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
};

export const markCarAsBooked = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    const car = await carService.markCarAsBooked(carId);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      message: 'Car marked as booked successfully',
      car: { id: car._id, make: car.brand, medelName: car.modelName, isAvailable: car.isAvailable }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating car status', error: error.message });
  }
};

export const markCarAsAvailable = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    const car = await carService.markCarAsAvailable(carId);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      message: 'Car marked as available successfully',
      car: { id: car._id, make: car.brand, medelName: car.modelName, isAvailable: car.isAvailable }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating car status', error: error.message });
  }
};