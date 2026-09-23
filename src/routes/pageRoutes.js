import { Router } from 'express';
import { listPublishedArticles, getPublishedArticle } from '../controllers/publicController.js';
import { preparePage, requirePageRole, loadWeather } from '../controllers/pageController.js';
import { showLogin } from '../controllers/authController.js';
import { listReporterArticles, getReporterArticle } from '../controllers/reporterController.js';
import { listArticles, getArticle } from '../controllers/editorController.js';

const router = Router();

router.get('/', preparePage, loadWeather, listPublishedArticles);
router.get('/articles/:id', preparePage, loadWeather, getPublishedArticle);

router.get('/login', preparePage, showLogin);
router.get('/reporter', preparePage, requirePageRole('reporter'), listReporterArticles);
router.get('/reporter/articles/new', preparePage, requirePageRole('reporter'), (req, res) => {
  res.render('pages/reporter-form', { article: null });
});
router.get('/reporter/articles/:id', preparePage, requirePageRole('reporter'), getReporterArticle);
router.get('/editor', preparePage, requirePageRole('editor'), listArticles);
router.get('/editor/articles/:id', preparePage, requirePageRole('editor'), getArticle);

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
