const HttpStatus = require("../constants/statusCode");

const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            console.log('req.query', req.query);

            const result = schema.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0].message;
                console.error('SafeParse Error:', result); // Handles error gracefully

                res.status(HttpStatus.BAD_REQUEST).json({ message });

                return
            } else {
                req.validateQuery = result.data
                next()
            }
        } catch (error) {
            next(error)
        }
    }
}

module.exports = validateQuery;