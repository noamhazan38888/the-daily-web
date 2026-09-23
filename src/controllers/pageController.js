export function publicPage(req, res, next) {
  // Only page routes set this flag; the existing API routes continue returning JSON.
  res.locals.pageView = true;
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
