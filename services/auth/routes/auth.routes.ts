import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../../../shared/middleware/auth.middleware';
import { checkEmailExists, validateUserRole } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', checkEmailExists, validateUserRole, register);
router.post('/login', login);
router.get('/profile', authenticateToken as any, getProfile); // ← Add "as any"

export default router;