import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    
    res.status(201).json({
      message: 'User created successfully',
      ...result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await authService.getProfile(req.user!.userId); // req.user is now available
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};