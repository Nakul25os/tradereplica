const HttpError = require("../utils/httpError");

const notFound = (req, res, next) => {
  next(new HttpError(404, "Route not found."));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error.",
    details: error.details || null,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

