import express from 'express';
import {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getAvailableCars
} from '../controllers/car.controller';
import {
  checkCarAvailability,
  markCarAsBooked,
  markCarAsAvailable
} from '../controllers/car.controller';
import { authenticateToken, requireAdmin } from '../../../shared/middleware/auth.middleware';
import { validateCarExists, validateAvailabilityRequest } from '../middlewares/car.middleware';

const router = express.Router();

// Existing routes
router.get('/', getCars);
router.get('/available', getAvailableCars);
router.get('/:id', validateCarExists, getCarById);

// Use type assertion to fix the conflict
router.post('/', authenticateToken as any, requireAdmin as any, createCar);
router.put('/:id', authenticateToken as any, requireAdmin as any, validateCarExists, updateCar);
router.delete('/:id', authenticateToken as any, requireAdmin as any, validateCarExists, deleteCar);

// NEW Availability routes
router.post('/check-availability', validateAvailabilityRequest, checkCarAvailability);
router.post('/:id/book', authenticateToken as any, validateCarExists, markCarAsBooked);
router.post('/:id/release', authenticateToken as any, validateCarExists, markCarAsAvailable);

export default router;