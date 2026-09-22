import { Router } from 'express';
import {
	createViewStat,
	deleteArticle,
	deleteViewStat,
	getArticle,
	listArticles,
	listViewStats,
	publishArticle,
	requestChanges,
	updateArticle,
	updateViewStat
} from '../controllers/editorController.js';
import { deleteComment, updateComment } from '../controllers/publicController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireRole('editor'));
router.get('/articles', listArticles);
router.get('/articles/:id', getArticle);
router.patch('/articles/:id', updateArticle);
router.post('/articles/:id/publish', publishArticle);
router.post('/articles/:id/request-changes', requestChanges);
router.delete('/articles/:id', deleteArticle);
router.get('/articles/:id/view-stats', listViewStats);
router.post('/articles/:id/view-stats', createViewStat);
router.patch('/articles/:id/view-stats/:statId', updateViewStat);
router.delete('/articles/:id/view-stats/:statId', deleteViewStat);
router.patch('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

export default router;
