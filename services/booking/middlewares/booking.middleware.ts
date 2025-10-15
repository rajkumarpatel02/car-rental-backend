import { Request, Response, NextFunction } from 'express';

export const validateBookingData = (req: Request, res: Response, next: NextFunction) => {
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