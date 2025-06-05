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

// const users = {}; // email -> socket.id
// const waitingQueue = [];
// const emailToSocketIdMap = new Map();
// const inCallUsers = new Set();



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

// function pairUsers() {
//   // Filter out users in call
//   const availableUsers = waitingQueue.filter(u => !inCallUsers.has(u.email));

//   // Clear queue and refill with only available users
//   waitingQueue.length = 0;
//   waitingQueue.push(...availableUsers);

//   // While we have at least 2 users, pair them
//   while (waitingQueue.length >= 2) {
//     const user1 = waitingQueue.shift();
//     const user2 = waitingQueue.shift();

//     inCallUsers.add(user1.email);
//     inCallUsers.add(user2.email);

//     console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

//     io.to(user1.socketId).emit("matched:pair", { peer: user2.email, peerSocketId: user2.socketId });
//     io.to(user2.socketId).emit("matched:pair", { peer: user1.email, peerSocketId: user1.socketId });
//   }
// }

// io.on("connection", (socket) => {
//   console.log("🔌 New connection:", socket.id);

//   socket.on("user:online", ({ email }) => {
//     users[email] = socket.id;
//     console.log(`✅ ${email} is online as ${socket.id}`);
//     io.emit("online:users", Object.keys(users).map(email => ({ email })));
//   });

//   // socket.on("user:ready", ({ email }) => {
//   //   if (inCallUsers.has(email)) return;
//   //   users[email] = socket.id;
//   //   // waitingQueue.push({ email, socketId: socket.id });
//   //   console.log(`🕒 ${email} added to waiting queue.`);
//   //   const alreadyInQueue = waitingQueue.find(u => u.email === email);
//   //   if (!alreadyInQueue) {
//   //     waitingQueue.push({ email, socketId: socket.id });
//   //     console.log(`🕒 ${email} added to waiting queue.`);
//   //   }

//   //   // Try pairing users
//   //   while (waitingQueue.length >= 2) {
//   //     const user1 = waitingQueue.shift();
//   //     const user2 = waitingQueue.shift();
//   //     if (inCallUsers.has(user1.email) || inCallUsers.has(user2.email)) continue;
//   //     inCallUsers.add(user1.email);
//   //     inCallUsers.add(user2.email);
//   //     console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

//   //     io.to(user1.socketId).emit("matched:pair", { peer: user2.email, peerSocketId: user2.socketId });
//   //     io.to(user2.socketId).emit("matched:pair", { peer: user1.email, peerSocketId: user1.socketId });

//   //     // Remove paired users from online list
//   //     // delete users[user1.email];
//   //     // delete users[user2.email];

//   //     // // Update global user list
//   //     // io.emit("online:users", Object.keys(users).map(email => ({ email })));
//   //   }
//   // });


//   socket.on("user:ready", ({ email }) => {
//     if (inCallUsers.has(email)) return;

//     // Add user to users map and queue if not already present
//     users[email] = socket.id;
//     const alreadyInQueue = waitingQueue.find(u => u.email === email);
//     if (!alreadyInQueue) {
//       waitingQueue.push({ email, socketId: socket.id });
//       console.log(`🕒 ${email} added to waiting queue.`);
//     }

//     pairUsers();
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

//       // ✅ Remove both users from the `users` object
//       delete users[fromEmail];
//       delete users[to];

//       // ✅ Update the online users for everyone
//       io.emit("online:users", Object.keys(users).map(email => ({ email })));
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
//       inCallUsers.delete(email);

//       // Remove from waiting queue
//       const index = waitingQueue.findIndex(user => user.email === email);
//       if (index !== -1) {
//         waitingQueue.splice(index, 1);
//       }

//       io.emit("online:users", Object.keys(users).map(email => ({ email })));

//       pairUsers();
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

(async () => {
  try {
    const conn = await pool.connect();
    console.log('✅ PostgreSQL Connected');
    conn.release();
  } catch (err) {
    console.error('❌ PostgreSQL Connection Error:', err);
  }
})();

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
let isPairingInProgress = false;
const users = {}; // email -> socket.id
const waitingQueue = [];
const emailToSocketIdMap = new Map();
const inCallUsers = new Set();
const connectingUsers = new Set();

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

function pairUsers() {

  if (isPairingInProgress) return;
  isPairingInProgress = true;
  const availableUsers = waitingQueue.filter(u =>
    !inCallUsers.has(u.email) && !connectingUsers.has(u.email)
  );

  // Clear queue and refill with only available users
  waitingQueue.length = 0;
  waitingQueue.push(...availableUsers);

  while (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    // Mark as connecting
    connectingUsers.add(user1.email);
    connectingUsers.add(user2.email);

    console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

    io.to(user1.socketId).emit("matched:pair", {
      peer: user2.email,
      peerSocketId: user2.socketId,
    });

    setTimeout(() => {
      io.to(user2.socketId).emit("matched:pair", {
        peer: user1.email,
        peerSocketId: user1.socketId,
        delay: true // 👈 Add delay flag
      });
    }, 7000); // 7-second delay
  }
  isPairingInProgress = false;
}


io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("user:online", ({ email }) => {
    users[email] = socket.id;
    console.log(`✅ ${email} is online as ${socket.id}`);
    io.emit("online:users", Object.keys(users).map(email => ({ email })));

  });

  socket.on("user:ready", ({ email }) => {
    if (inCallUsers.has(email)) return;

    // Add user to users map and queue if not already present
    users[email] = socket.id;
    const alreadyInQueue = waitingQueue.find(u => u.email === email);
    if (!alreadyInQueue) {
      waitingQueue.push({ email, socketId: socket.id });
      console.log(`🕒 ${email} added to waiting queue.`);
    }


    pairUsers();

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

      //✅ Remove both users from the `users` object
      delete users[fromEmail];
      delete users[to];

      inCallUsers.delete(fromEmail);
      inCallUsers.delete(to);

      // ✅ Update the online users for everyone
      io.emit("online:users", Object.keys(users).map(email => ({ email })));
      pairUsers();
    }
  });

  socket.on("user:leave", ({ email, secondUser }) => {
    console.log(`⏩ ${email} skipped ${secondUser}`);

    // Clean up in-call users
    inCallUsers.delete(email);
    inCallUsers.delete(secondUser);

    // Re-add the skipping user to the queue
    if (!waitingQueue.find(u => u.email === email)) {
      waitingQueue.push({ email, socketId: socket.id });
    }

    pairUsers();
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
      inCallUsers.delete(email);

      // Remove from waiting queue
      const index = waitingQueue.findIndex(user => user.email === email);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
      }

      io.emit("online:users", Object.keys(users).map(email => ({ email })));

      pairUsers();
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

