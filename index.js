const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

app.set("views", path.join(__dirname, "/views"))
app.set("view engine", "hbs");

app.get('/', (req, res) => {
  res.render('index');
});

server.listen(PORT, () => {
  console.log('listening on *:3000');
});