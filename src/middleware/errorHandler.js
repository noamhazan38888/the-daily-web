export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  // Invalid input (failed schema validation or a malformed id) is the client's mistake, not a server failure.
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid data',
      details: Object.values(error.errors).map((fieldError) => fieldError.message)
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id or value' });
  }

  res.status(error.statusCode ?? 500).json({
    error: error.statusCode ? error.message : 'Internal server error'
  });
}
