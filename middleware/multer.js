const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
}).fields([
  { name: "variantImg1", maxCount: 1 },
  { name: "variantImg2", maxCount: 1 },
  { name: "variantImg3", maxCount: 1 },
]);

module.exports = upload;
