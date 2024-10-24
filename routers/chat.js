const { sessionClient } = require("../appwrite");
const express = require("express");
const { checkSessionCookie } = require("../middlewares");
const { Databases, ID, Query } = require("node-appwrite");
const router = express.Router();

router.get("/", checkSessionCookie, async(req, res) => {
    const client = sessionClient.setSession(req.cookies.session);
    const QUERY_LIMIT = 50;
    
    try {
        const databases = new Databases(client);
        const result = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            [
                Query.select(["message", "userId", "$createdAt", "$id"]),
                Query.orderDesc("$createdAt"),
                Query.limit(QUERY_LIMIT)
            ]
        );

        res.status(200).json({ success: true, result: result.documents });
    } catch (e) {
        res.status(e.code).json({
            success: false,
            type: e.type,
            error: e.message
        });
    }
});

router.post("/create", checkSessionCookie, async (req, res) => {
    const { userId, message } = req.body;

    const client = sessionClient.setSession(req.cookies.session);

    try {
        const data = {
            message: message.trim(),
            userId: userId,
        };

        const db = new Databases(client);
        const result = await db.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            ID.unique(),
            {...data}
        );

        res.status(200).json({
            success: true,
            result: {
                id: result.$id,
                userId: result.userId,
                message: result.message,
                createdAt: result.$createdAt
            }
        });
    } catch (e) {
        res.status(e.code).json({
            success: false,
            type: e.type,
            error: e.message
        });
    }
});

module.exports = { router };
