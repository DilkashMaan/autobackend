// import express from 'express';
// import pkg from 'pg';
// const { Pool } = pkg;
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes from './routes/auth.js';
// import { Server } from 'socket.io';
// import http from 'http';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ✅ Setup PostgreSQL connection
// const pool = new Pool({
//   connectionString: "postgresql://dilkash:LLZTQ4MBZOr52aioxpG6FSWStDvCpgV1@dpg-d0un9j3ipnbc73ej7vag-a.oregon-postgres.render.com/videochat_ilcb",
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

// try {
//   const conn = await pool.connect();
//   console.log('✅ PostgreSQL Connected');
//   conn.release();
// } catch (err) {
//   console.error('❌ PostgreSQL Connection Error:', err);
// }

// // Attach DB pool to request object
// app.use((req, res, next) => {
//   req.db = pool;
//   next();
// });

// // Auth routes
// app.use('/api/auth', authRoutes);

// // Socket.IO logic
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

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
//       io.to(targetSocketId).emit("incoming:call", { from: fromEmail, offer });
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
//       io.to(targetSocketId).emit("peer:nego:needed", { from: getEmailBySocketId(socket.id), offer });
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

const users = {};
const busyUsers = new Set();
const availableUsers = [];

function getEmailBySocketId(socketId) {
  return Object.keys(users).find(email => users[email] === socketId);
}

function matchUsers() {
  while (availableUsers.length >= 2) {
    const user1 = availableUsers.shift();
    const user2 = availableUsers.shift();

    const socket1 = users[user1];
    const socket2 = users[user2];

    if (socket1 && socket2) {
      busyUsers.add(user1);
      busyUsers.add(user2);

      // Send incoming call to both
      io.to(socket1).emit("incoming:call", { from: user2 });
      io.to(socket2).emit("incoming:call", { from: user1 });
    }
  }
}

function getAvailableUserList() {
  return Object.keys(users)
    .filter(email => !busyUsers.has(email))
    .map(email => ({ email }));
}


io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("user:online", ({ email }) => {
    users[email] = socket.id;

    if (!busyUsers.has(email) && !availableUsers.includes(email)) {
      availableUsers.push(email);
    }

    console.log(`✅ ${email} is online as ${socket.id}`);

    io.emit("online:users", getAvailableUserList());
    matchUsers(); // Try pairing users
  });


  socket.on("user:call", ({ to, offer }) => {
    const fromEmail = getEmailBySocketId(socket.id);
    if (busyUsers.has(fromEmail) || busyUsers.has(to)) {
      console.log(`❌ Call rejected: ${fromEmail} or ${to} is busy`);
      return;
    }
    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming:call", { from: fromEmail, offer });
    }
  });

  socket.on("call:accepted", ({ to, ans }) => {
    const fromEmail = getEmailBySocketId(socket.id);

    busyUsers.add(fromEmail);
    busyUsers.add(to);

    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:accepted", { ans });
    }

    io.emit("online:users", Object.keys(users)
      .filter(email => !busyUsers.has(email))
      .map(email => ({ email }))
    );
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

  socket.on("call:ended", ({ to }) => {
    const fromEmail = getEmailBySocketId(socket.id);

    busyUsers.delete(fromEmail);
    busyUsers.delete(to);

    if (!availableUsers.includes(fromEmail)) availableUsers.push(fromEmail);
    if (!availableUsers.includes(to)) availableUsers.push(to);

    io.emit("online:users", getAvailableUserList());
    matchUsers(); // Try to match again
  });


  socket.on("disconnect", () => {
    const email = getEmailBySocketId(socket.id);

    if (email) {
      delete users[email];
      busyUsers.delete(email);

      const index = availableUsers.indexOf(email);
      if (index !== -1) {
        availableUsers.splice(index, 1);
      }

      io.emit("online:users", getAvailableUserList());
      matchUsers(); // Optional: try matching again
    }
  });

});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

