const HttpStatus = require("../constants/statusCode");

const validateBody = (schema, page) => {
    return (req, res, next) => {
        try {
            console.log('req.body',req.body);
            
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const message = result.error.issues[0].message;
                console.error('SafeParse Error:', result); // Handles error gracefully
                if (page == 'register') {

                    res.status(HttpStatus.BAD_REQUEST).render(page, { message, old: req.body })
                } else {
                    res.status(HttpStatus.BAD_REQUEST).json({ message });
                }
                return
            } else {
                req.validatedBody = result.data
                next()
            }
        } catch (error) {
            next(error)
        }
    }
}

module.exports = validateBody;