const ROUTES = require("./routes");

const checkSessionCookie = (req, res, next) => {
    if (!req.cookies.session) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    next();
}

const checkSessionCookieRedirect = (req, res, next) => {
    if (!req.cookies.session) {
        return res.redirect(ROUTES.LOGIN);
    }

    next();
}

module.exports = {
    checkSessionCookie,
    checkSessionCookieRedirect
};