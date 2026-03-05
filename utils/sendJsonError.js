function sendErrorRes(req, res, statusCode, message, data = {}) {
  res.status(statusCode).json({ success: false, message, ...data });
}
module.exports = sendErrorRes;
