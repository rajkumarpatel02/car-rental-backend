import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../shared/config';
import { rabbitMQ } from '../../../shared/events/rabbitmq';
import { EVENT_TYPES } from '../../../shared/events/eventTypes';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    await rabbitMQ.sendToQueue(EVENT_TYPES.USER_CREATED, {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      timestamp: new Date()
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}