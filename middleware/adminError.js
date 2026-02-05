const errorMiddleware = (error, req, res, _next) => {
  console.error(error);
  return res.render("error");
};

module.exports = errorMiddleware;
