const { Account, ID } = require("node-appwrite");
const { sessionClient, adminClient } = require("../appwrite");
const express = require("express");
const { checkSessionCookieRedirect, redirectHasSession, checkSessionCookie } = require("../middlewares");
const ROUTES = require("../routes");
const router = express.Router();

router.get("/login", redirectHasSession, (req, res) => {
    const data = {
        action: ROUTES.LOGIN,
        signupLink: ROUTES.SIGNUP
    }

    if (req.query.signup && req.query.signup === "success") {
        data.signupSuccess = true;
    }

    res.render("login", data);
});

router.post("/login", redirectHasSession, async (req, res) => {
    const { email, password } = req.body;

    const account = new Account(adminClient);

    try {
        const session = await account.createEmailPasswordSession(
            email,
            password
        );

        res.cookie("session", session.secret, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: new Date(session.expire).getTime(),
            path: "/",
        });

        res.redirect(ROUTES.HOME);
    } catch (e) {
        res.status(400).render('login', { error: e.message });
    }
});

router.get("/signup", redirectHasSession, (_, res) => {
    res.render("signup", { action: ROUTES.SIGNUP, loginLink: ROUTES.LOGIN });
});

router.post("/signup", redirectHasSession, async (req, res) => {
    const { name, email, password } = req.body;

    const account = new Account(adminClient);

    try {
        await account.create(
            ID.unique(),
            email,
            password,
            name,
        );

        res.redirect(`${ROUTES.LOGIN}?signup=success`);
    } catch (e) {
        res.status(400).render('signup', { error: e.message });
    }
});

router.post("/logout", checkSessionCookieRedirect ,async (req, res) => {
    const client = sessionClient.setSession(req.cookies.session);
    const account = new Account(client);

    try {
        await account.deleteSession('current');
        res.clearCookie("session");
        res.redirect(ROUTES.LOGIN);
    } catch (e) {
        res.status(400).send(e.message);
    }
});

router.get("/me", checkSessionCookie, async (req, res) => {
    const client = sessionClient.setSession(req.cookies.session);
    const account = new Account(client);

    try {
        const user = await account.get();

        res.status(200).json({ success: true, user: { name: user.name, id: user.$id } });
    } catch (e) {
        res.status(e.code).json({ success: false, error: e.message });
    }
});

module.exports = { router };
