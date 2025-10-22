// import { Request, Response, NextFunction } from 'express';

// export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const user = (req as any).user;
    
//     if (!user) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }

//     // TEMPORARY: Allow any authenticated user during development
//     console.log('⚠️  ADMIN CHECK BYPASSED - User:', user.email);
//     next();
    
//     // COMMENT OUT THE REAL CHECK:
//     // if (user.role !== 'admin') {
//     //   return res.status(403).json({ message: 'Admin access required' });
//     // }
//     // next();
    
//   } catch (error) {
//     return res.status(500).json({ message: 'Server error' });
//   }
// };