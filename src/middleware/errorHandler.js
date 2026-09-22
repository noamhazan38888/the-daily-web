export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode ?? 500).json({
    error: error.statusCode ? error.message : 'Internal server error'
  });
}
