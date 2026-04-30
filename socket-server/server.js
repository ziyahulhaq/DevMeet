import { Server } from "socket.io";
import http from "http";

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send-message", (msg) => {
    io.emit("receive-message", msg);
  });
});

server.listen(8001, () => {
  console.log("Socket server running on port 8001");
});