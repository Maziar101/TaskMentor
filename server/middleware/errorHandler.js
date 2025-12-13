function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Unexpected error";
  res.status(status).json({ message });
}

module.exports = errorHandler;
