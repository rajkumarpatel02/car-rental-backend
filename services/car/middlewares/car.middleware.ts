import { Request, Response, NextFunction } from 'express';
import { Car } from '../models/Car';
import mongoose from 'mongoose';

export const validateCarExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Validating car with ID:', id);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        message: 'Invalid car ID format',
        details: 'Car ID must be a 24-character hex string'
      });
    }
    
    // Check if car exists
    const car = await Car.findById(id);
    console.log('📦 Car found in middleware:', car ? 'YES' : 'NO');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Attach car to request for use in controller
    (req as any).car = car;
    console.log('✅ Car attached to request');
    
    next();
  } catch (error) {
    console.error('💥 Error in validateCarExists:', error);
    res.status(500).json({ message: 'Server error checking car existence' });
  }
};

export const validateAvailabilityRequest = (req: Request, res: Response, next: NextFunction) => {
  const { carId, startDate, endDate } = req.body;

  if (!carId || !startDate || !endDate) {
    return res.status(400).json({
      message: 'Missing required fields: carId, startDate, endDate'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (start < today) {
    return res.status(400).json({
      message: 'Start date cannot be in the past'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      message: 'End date must be after start date'
    });
  }

  next();
};