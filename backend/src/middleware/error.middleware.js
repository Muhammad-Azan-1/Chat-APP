import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import logger from "../logger/winston.logger.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Check if the error is an instance of an ApiError class
  if (!(error instanceof ApiError)) {
    // assign an appropriate status code
    const statusCode = error?.statusCode || (error instanceof mongoose.Error ? 400 : 500);

    // set a message from native Error instance or a custom one
    const message = error?.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], error?.stack);
  }

  // Now we are sure that the `error` variable will be an instance of ApiError class
  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error?.stack } : {}),
  };
  

  // Beautifully log the error using Winston
   logger.error(error.message);
  logger.error(response);

  // Send error response
  return res?.status(error.statusCode).json(response);
};

export { errorHandler };
