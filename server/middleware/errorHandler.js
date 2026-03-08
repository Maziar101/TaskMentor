function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status =
    Number.isInteger(err?.statusCode) && err.statusCode > 0
      ? err.statusCode
      : Number.isInteger(err?.status) && err.status > 0
      ? err.status
      : 500;
  const message = err.message || "Unexpected error";
  res.status(status).json({ message });
}

export default errorHandler;
