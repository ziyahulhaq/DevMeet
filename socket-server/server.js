import { Server } from "socket.io";
import http from "http";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sales_db2",
  password: "password",
  port: 5432,
});

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send-message", async (msg) => {
    const email = msg?.email?.trim().toLowerCase();
    const message = typeof msg?.message === "string" ? msg.message.trim() : "";

    if (!email || !message) {
      socket.emit("message-error", "Email and message are required");
      return;
    }

    try {

      const result = await pool.query(
        "INSERT INTO messages (user_email, message) VALUES ($1,$2) RETURNING *",
        [email, message]
      );

      const savedMessage = result.rows[0];

      console.log("Saved:", savedMessage);

      io.emit("receive-message", savedMessage);

    } catch (error) {
      console.error("DB error:", error);
    }
  });
});

server.listen(8001, () => {
  console.log("Socket server running on port 8001");
});
