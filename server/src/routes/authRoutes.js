import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { addPatient, getPatients, deletePatient } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

// Doctor-specific routes
router.post('/patients', authMiddleware, addPatient);
router.get('/patients', authMiddleware, getPatients);
router.delete('/patients/:patientId', authMiddleware, deletePatient);

export default router;
