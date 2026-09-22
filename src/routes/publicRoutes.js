import { Router } from 'express';
import {
	createComment,
	getPublishedArticle,
	listArticleComments,
	listPublishedArticles
} from '../controllers/publicController.js';

const router = Router();

router.get('/articles', listPublishedArticles);
router.get('/articles/:id', getPublishedArticle);
router.get('/articles/:id/comments', listArticleComments);
router.post('/articles/:id/comments', createComment);

export default router;
