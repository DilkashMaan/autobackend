import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Setup PostgreSQL connection
const pool = new Pool({
  connectionString: "postgresql://dilkash:LLZTQ4MBZOr52aioxpG6FSWStDvCpgV1@dpg-d0un9j3ipnbc73ej7vag-a.oregon-postgres.render.com/videochat_ilcb",
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  const conn = await pool.connect();
  console.log('✅ PostgreSQL Connected');
  conn.release();
} catch (err) {
  console.error('❌ PostgreSQL Connection Error:', err);
}

// Attach DB pool to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Auth routes
app.use('/api/auth', authRoutes);

// Socket.IO logic
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
let activeQueue = [];
const users = {}; // email -> socket.id
const waitingQueue = [];
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

app.get('/api/online-users', (req, res) => {
  const onlineUsers = Array.from(emailToSocketIdMap.keys());
  res.json({ onlineUsers });
});

setInterval(() => {
  console.log('📡 Online Users:', Array.from(emailToSocketIdMap.entries()));
}, 3000);

function getEmailBySocketId(socketId) {
  return Object.keys(users).find(email => users[email] === socketId);
}

function tryToMatchUsers() {
  // Only match if no one is currently matched
  if (activeQueue.length === 0 && waitingQueue.length >= 2) {
    const [user1, user2] = [waitingQueue.shift(), waitingQueue.shift()];
    activeQueue = [user1, user2];

    // Send each other as online
    user1.emit('online:users', [{ email: user2.email }]);
    user2.emit('online:users', [{ email: user1.email }]);
  }
}

io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  // socket.on("user:online", ({ email }) => {
  //   users[email] = socket.id;
  //   console.log(`✅ ${email} is online as ${socket.id}`);
  //   io.emit("online:users", Object.keys(users).map(email => ({ email })));
  // });

  socket.on('user:online', ({ email }) => {
    socket.email = email;

    // Avoid duplicate entry
    if (!waitingQueue.find(s => s.email === email) &&
      !activeQueue.find(s => s.email === email)) {
      waitingQueue.push(socket);
    }

    tryToMatchUsers();
  });


  socket.on('user:leave', ({ email, secondUser }) => {
    // Remove from activeQueue
    activeQueue = activeQueue.filter(s => s.email !== email && s.email !== secondUser);

    // Re-add to waitingQueue if still connected
    if (socket.connected) {
      waitingQueue.push(socket);
    }

    tryToMatchUsers();
  });

  socket.on("user:ready", ({ email }) => {
    users[email] = socket.id;
    waitingQueue.push({ email, socketId: socket.id });
    console.log(`🕒 ${email} added to waiting queue.`);

    // Try pairing users
    while (waitingQueue.length >= 2) {
      const user1 = waitingQueue.shift();
      const user2 = waitingQueue.shift();

      console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

      io.to(user1.socketId).emit("matched:pair", { peer: user2.email, peerSocketId: user2.socketId });
      io.to(user2.socketId).emit("matched:pair", { peer: user1.email, peerSocketId: user1.socketId });

      // Remove paired users from online list
      delete users[user1.email];
      delete users[user2.email];

      // Update global user list
      io.emit("online:users", Object.keys(users).map(email => ({ email })));
    }
  });


  socket.on("user:call", ({ to, offer }) => {
    const targetSocketId = users[to];
    const fromEmail = getEmailBySocketId(socket.id);
    console.log(`📞 ${fromEmail} is calling ${to}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming:call", { from: fromEmail, offer });
    }
  });

  socket.on("call:accepted", ({ to, ans }) => {
    const targetSocketId = users[to];
    const fromEmail = getEmailBySocketId(socket.id);

    console.log(`✅ ${fromEmail} accepted call from ${to}`);

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:accepted", { ans });

      // ✅ Remove both users from the `users` object
      delete users[fromEmail];
      delete users[to];

      // ✅ Update the online users for everyone
      io.emit("online:users", Object.keys(users).map(email => ({ email })));
    }
  });


  socket.on("peer:nego:needed", ({ to, offer }) => {
    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("peer:nego:needed", { from: getEmailBySocketId(socket.id), offer });
    }
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("peer:nego:final", { ans });
    }
  });

  socket.on("disconnect", () => {
    const email = getEmailBySocketId(socket.id);
    console.log(`❌ Disconnected: ${email || socket.id}`);

    if (email) {
      delete users[email];

      // ❌ Remove from waiting queue if they were waiting
      const index = waitingQueue.findIndex(user => user.email === email);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
      }

      io.emit("online:users", Object.keys(users).map(email => ({ email })));
    }
  });

});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



