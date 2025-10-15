import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const checkEmailExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUserRole = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;
  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  next();
};