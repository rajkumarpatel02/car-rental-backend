import express from 'express';
import { createBooking, getUserBookings, getBookingById } from '../controllers/booking.controllers';
import { authenticateToken } from '../../../shared/middleware/auth.middleware';
import { validateBookingData } from '../middlewares/booking.middleware';

const router = express.Router();

router.post('/', authenticateToken as any, validateBookingData, createBooking);
router.get('/', authenticateToken as any, getUserBookings);
router.get('/:id', authenticateToken as any, getBookingById);

export default router;