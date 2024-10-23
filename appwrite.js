const sdk = require("node-appwrite");

const adminClient = new sdk.Client();
const sessionClient = new sdk.Client();

adminClient
    .setEndpoint(process.env.APPWRITE_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_SECRET_KEY);

sessionClient
    .setEndpoint(process.env.APPWRITE_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)

module.exports = { adminClient, sessionClient };