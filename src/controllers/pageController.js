import { getWeather } from '../services/weather.js';

export function preparePage(req, res, next) {
  // Only page routes set this flag; the existing API routes continue returning JSON.
  res.locals.pageView = true;
  res.locals.user = req.session?.user ?? null;
  res.locals.statusLabels = {
    draft: 'טיוטה', pending_review: 'ממתינה לאישור',
    published: 'פורסמה', changes_requested: 'נדרשים תיקונים'
  };
  res.locals.title = 'The Daily Web';
  res.locals.description = 'החדשות והכתבות של The Daily Web';
  res.locals.filters = {
    search: typeof req.query.search === 'string' ? req.query.search : '',
    category: typeof req.query.category === 'string' ? req.query.category : '',
    sort: req.query.sort === 'popular' ? 'popular' : ''
  };
  res.locals.formatDate = (value) => value ? new Date(value).toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem', dateStyle: 'medium', timeStyle: 'short'
  }) : '';
  res.locals.imageSource = (value) => {
    if (typeof value !== 'string') return '';
    return /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) ? value : '';
  };
  next();
}

export function requirePageRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role !== role) {
      return res.status(403).render('pages/error', {
        title: 'אין הרשאה', message: 'אין לך הרשאה לצפות בעמוד הזה.'
      });
    }
    next();
  };
}

export async function loadWeather(req, res, next) {
  res.locals.weather = await getWeather();
  next();
}
