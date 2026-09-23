import { Router } from 'express';
import { listPublishedArticles, getPublishedArticle } from '../controllers/publicController.js';
import { publicPage } from '../controllers/pageController.js';

const router = Router();

router.get('/', publicPage, listPublishedArticles);
router.get('/articles/:id', publicPage, getPublishedArticle);

router.use((error, req, res, next) => {
  if (!res.locals.pageView || res.headersSent) return next(error);
  const status = error.name === 'CastError' ? 404 : 500;
  if (status === 500) console.error(error);
  res.status(status).render('pages/error', {
    title: status === 404 ? 'הכתבה לא נמצאה' : 'לא ניתן לטעון את העמוד',
    message: 'אפשר לחזור לעמוד הבית או לנסות שוב מאוחר יותר.'
  });
});

export default router;
