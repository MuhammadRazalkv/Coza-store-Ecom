const MESSAGES = require("../constants/messages");
const HttpStatus = require("../constants/statusCode");

function parseSizes(req, res, next) {
    try {
        if (req.body.sizesInput) {
            req.body.sizes = JSON.parse(req.body.sizesInput);
            delete req.body.sizesInput;
        }

        next();
    } catch {
        return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.INVALID_SIZE_FORMAT,
        });
    }
}

module.exports = parseSizes;
