import { Server } from "socket.io";
import http from "http";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
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
        `
        INSERT INTO messages (user_email, message)
        VALUES ($1, $2)
        RETURNING *
      `,
        [email, message]
      );
      const rows = result.rows;
      const savedMessage = rows[0];

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
