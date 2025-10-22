import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dtos/booking.dto';


const bookingService = new BookingService();

export const createBooking = async (req: Request, res: Response) => {
  try {
    const createBookingDto: CreateBookingDto = req.body;
    const userId = req.user!.userId; // req.user is now available globally

    const booking = await bookingService.createBooking(createBookingDto, userId);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const bookings = await bookingService.getUserBookings(userId);
    
    res.json({
      message: 'Bookings retrieved successfully',
      bookings
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const booking = await bookingService.getBookingById(id, userId);
    
    res.json({
      message: 'Booking retrieved successfully',
      booking
    });
  } catch (error: any) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};