const cloudinary = require("../config/cloudinary");

async function uploadToCloudinary(fileBuffer) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: "products/variants" },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        ).end(fileBuffer);
    });
}
module.exports = uploadToCloudinary;