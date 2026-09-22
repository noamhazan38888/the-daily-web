import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser
} from '../controllers/userController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireRole('editor'));
router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
