/**
 * Success: { success: true, message, data, meta }
 * Error:   { success: false, message, error: { code, message, details? }, meta }
 */

function metaWithTimestamp(extra = {}) {
  return { ...extra, timestamp: new Date().toISOString() };
}

function sendSuccess(res, data, meta = {}, message = "Request completed successfully") {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json({
    success: true,
    message,
    data,
    meta: metaWithTimestamp(meta),
  });
}

function sendError(res, httpStatus, code, message, details) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(httpStatus).json({
    success: false,
    message,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    meta: metaWithTimestamp(),
  });
}

module.exports = { sendSuccess, sendError, metaWithTimestamp };
