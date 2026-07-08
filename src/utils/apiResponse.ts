export function sendSuccess<T>(
  data: T,
  message = "Success",
) {
  return {
    success: true,
    message,
    data,
  };
}

export function sendError(
  message = "Something went wrong",
  errorDetails: unknown = null,
) {
  return {
    success: false,
    message,
    errorDetails,
  };
}