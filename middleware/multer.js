const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/assets/productImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "variantImg1", maxCount: 1 },
  { name: "variantImg2", maxCount: 1 },
  { name: "variantImg3", maxCount: 1 },
  // { name: 'productImg4', maxCount: 1 }
]);

module.exports = upload;
