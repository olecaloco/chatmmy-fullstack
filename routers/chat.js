const { client } = require("../appwrite");
const express = require("express");
const { checkSessionCookie } = require("../middlewares");
const router = express.Router();

router.post('/create', checkSessionCookie, (req, res) => {
    const { message } = req.body;

    client.setSession(req.cookies.session);
  
    try {
      res.status(200).json({ success: true, data: { message } });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
});

module.exports = { router };