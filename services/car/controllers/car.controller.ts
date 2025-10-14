import { Request, Response } from 'express';
import { Car } from '../models/Car';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../../shared/events/eventTypes';

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
      make: car.make,
      model: car.model,
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