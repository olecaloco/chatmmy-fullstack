require("dotenv").config();
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);
const { router: AuthRouter } = require("./routers/auth");
const { router: ChatRouter } = require("./routers/chat");
const { checkSessionCookieRedirect } = require("./middlewares");
const ROUTES = require("./routes");

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', checkSessionCookieRedirect, (_, res) => {
  res.render('index', { logoutLink: ROUTES.LOGOUT });
});

app.use("/auth", AuthRouter);
app.use("/chat", ChatRouter);

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);