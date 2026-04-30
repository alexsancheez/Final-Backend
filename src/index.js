import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "./app.js";
import config from "./config/index.js";
import connectDB from "./config/database.js";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Token no proporcionado"));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Token invalido"));
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  if (socket.user) {
    mongoose.model("User").findById(socket.user.id).then((user) => {
      if (user && user.company) {
        socket.join(user.company.toString());
      }
    });
  }

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

app.set("io", io);

const startServer = async () => {
  await connectDB();

  httpServer.listen(config.port, () => {
    console.log("Servidor corriendo en puerto " + config.port);
  });
};

const shutdown = async () => {
  console.log("Cerrando servidor...");
  io.close();
  await mongoose.connection.close();
  console.log("Servidor cerrado");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer().catch(console.error);
