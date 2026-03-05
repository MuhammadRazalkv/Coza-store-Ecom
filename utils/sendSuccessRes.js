function sendSuccessRes(req, res, statusCode, message, data = {}) {
  res.status(statusCode).json({ success: true, message, ...data });
}
module.exports = sendSuccessRes;
