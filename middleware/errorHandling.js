const errorMiddleware = (error, req, res, _next) => {
  console.error(error);
  const errorMsg = error.message;
  const status = error.status;
  return res.redirect("/errorD", { errorMsg, status });
};

module.exports = errorMiddleware;
