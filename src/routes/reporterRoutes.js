import { Router } from 'express';
import {
	createArticle,
	deleteArticle,
	getReporterArticle,
	listReporterArticles,
	updateArticle
} from '../controllers/reporterController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireRole('reporter'));
router.get('/articles', listReporterArticles);
router.post('/articles', createArticle);
router.get('/articles/:id', getReporterArticle);
router.patch('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

export default router;
