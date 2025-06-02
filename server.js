// // server.js

// import express from 'express';
// import mysql from 'mysql2/promise';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes from './routes/auth.js';  
// import { Server } from 'socket.io';
// import http from 'http';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ✅ Setup MySQL connection
// const pool = mysql.createPool({
//   host: 'localhost',
//   port: 3306,
//   user: 'root',
//   password: 'admin@123',
//   database: 'dilsdb',
// });

// try {
//   const conn = await pool.getConnection();
//   console.log('✅ MySQL Connected');
//   conn.release();
// } catch (err) {
//   console.error('❌ MySQL Connection Error:', err);
// }

// // Pass pool to your routes if needed
// app.use((req, res, next) => {
//   req.db = pool; // attach the pool to the request
//   next();
// });

// // Auth routes
// app.use('/api/auth', authRoutes); // adapt to use `req.db` instead of Mongoose!

// // Create server and setup Socket.IO
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// // Socket.IO logic (same as before)
// const users = {};
// const emailToSocketIdMap = new Map();
// const socketIdToEmailMap = new Map();

// app.get('/api/online-users', (req, res) => {
//   const onlineUsers = Array.from(emailToSocketIdMap.keys());
//   res.json({ onlineUsers });
// });

// setInterval(() => {
//   console.log('📡 Online Users:', Array.from(emailToSocketIdMap.entries()));
// }, 3000);

// function getEmailBySocketId(socketId) {
//   return Object.keys(users).find(email => users[email] === socketId);
// }

// io.on("connection", (socket) => {
//   console.log("🔌 New connection:", socket.id);

//   socket.on("user:online", ({ email }) => {
//     users[email] = socket.id;
//     console.log(`✅ ${email} is online as ${socket.id}`);

//     io.emit("online:users", Object.keys(users).map(email => ({ email })));
//   });

//   socket.on("user:call", ({ to, offer }) => {
//     const targetSocketId = users[to];
//     const fromEmail = getEmailBySocketId(socket.id);
//     console.log(`📞 ${fromEmail} is calling ${to}`);

//     if (targetSocketId) {
//       io.to(targetSocketId).emit("incoming:call", {
//         from: fromEmail,
//         offer
//       });
//     }
//   });

//   socket.on("call:accepted", ({ to, ans }) => {
//     const targetSocketId = users[to];
//     const fromEmail = getEmailBySocketId(socket.id);
//     console.log(`✅ ${fromEmail} accepted call from ${to}`);

//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call:accepted", { ans });
//     }
//   });

//   socket.on("peer:nego:needed", ({ to, offer }) => {
//     const targetSocketId = users[to];
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("peer:nego:needed", {
//         from: getEmailBySocketId(socket.id),
//         offer
//       });
//     }
//   });

//   socket.on("peer:nego:done", ({ to, ans }) => {
//     const targetSocketId = users[to];
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("peer:nego:final", { ans });
//     }
//   });

//   socket.on("disconnect", () => {
//     const email = getEmailBySocketId(socket.id);
//     console.log(`❌ Disconnected: ${email || socket.id}`);
//     if (email) {
//       delete users[email];
//       io.emit("online:users", Object.keys(users).map(email => ({ email })));
//     }
//   });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));




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
    rejectUnauthorized: false, // Accept self-signed certificates
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

const users = {};
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

io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("user:online", ({ email }) => {
    users[email] = socket.id;
    console.log(`✅ ${email} is online as ${socket.id}`);
    io.emit("online:users", Object.keys(users).map(email => ({ email })));
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
      io.emit("online:users", Object.keys(users).map(email => ({ email })));
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



