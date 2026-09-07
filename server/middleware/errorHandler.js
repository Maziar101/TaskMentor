import { ValidationError } from "yup";

function errorHandler(err, _req, res, _next) {
  console.error(err);

  // Yup validation error handling
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.errors[0], // فقط خطای اول
    });
  }

  const status =
    Number.isInteger(err?.statusCode) && err.statusCode > 0
      ? err.statusCode
      : Number.isInteger(err?.status) && err.status > 0
        ? err.status
        : 500;

  const message = err.message || "Unexpected error";

  return res.status(status).json({
    success: false,
    message,
  });
}

export default errorHandler;
