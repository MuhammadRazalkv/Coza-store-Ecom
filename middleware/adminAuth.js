const isLogin = async (req, res, next) => {
  try {
    // !! change this
    // if (req.session.admin_id) {
    //   return next();
    // } else {
    //   return res.redirect("/admin");
    // }
    next()
  } catch (error) {
    console.log("err in isLogin on adminAuth", error);
    throw error;
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      return res.redirect("/admin/home");
    } else {
      return next();
    }
  } catch (error) {
    console.log("err in isLogout adminAuth", error);
    throw error;
  }
};

module.exports = {
  isLogin,
  isLogout,
};
