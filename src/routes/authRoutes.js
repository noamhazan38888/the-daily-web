import { Router } from 'express';
import {
  currentUser,
  login,
  logout,
  showLogin
} from '../controllers/authController.js';

const router = Router();

router.get('/login', showLogin);
router.post('/login', login);
router.get('/me', currentUser);
router.post('/logout', logout);

export default router;
