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

// (async () => {
//   try {
//     const conn = await pool.connect();
//     console.log('✅ PostgreSQL Connected');
//     conn.release();
//   } catch (err) {
//     console.error('❌ PostgreSQL Connection Error:', err);
//   }
// })();

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
// let isPairingInProgress = false;
// const users = {}; // email -> socket.id
// const waitingQueue = [];
// const emailToSocketIdMap = new Map();
// const inCallUsers = new Set();
// const connectingUsers = new Set();

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

//   if (isPairingInProgress) return;
//   isPairingInProgress = true;
//   const availableUsers = waitingQueue.filter(u =>
//     !inCallUsers.has(u.email) && !connectingUsers.has(u.email)
//   );

//   // Clear queue and refill with only available users
//   waitingQueue.length = 0;
//   waitingQueue.push(...availableUsers);

//   while (waitingQueue.length >= 2) {
//     const user1 = waitingQueue.shift();
//     const user2 = waitingQueue.shift();

//     // Mark as connecting
//     connectingUsers.add(user1.email);
//     connectingUsers.add(user2.email);

//     console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

//     io.to(user1.socketId).emit("matched:pair", {
//       peer: user2.email,
//       peerSocketId: user2.socketId,
//     });

//     setTimeout(() => {
//       io.to(user2.socketId).emit("matched:pair", {
//         peer: user1.email,
//         peerSocketId: user1.socketId,
//         delay: true // 👈 Add delay flag
//       });
//     }, 7000); // 7-second delay
//   }
//   isPairingInProgress = false;
// }


// io.on("connection", (socket) => {
//   console.log("🔌 New connection:", socket.id);

//   socket.on("user:online", ({ email }) => {
//     users[email] = socket.id;
//     console.log(`✅ ${email} is online as ${socket.id}`);
//     io.emit("online:users", Object.keys(users).map(email => ({ email })));

//   });

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

//       //✅ Remove both users from the `users` object
//       delete users[fromEmail];
//       delete users[to];

//       inCallUsers.delete(fromEmail);
//       inCallUsers.delete(to);

//       // ✅ Update the online users for everyone
//       io.emit("online:users", Object.keys(users).map(email => ({ email })));
//       pairUsers();
//     }
//   });

//   socket.on("user:leave", ({ email, secondUser }) => {
//     console.log(`⏩ ${email} skipped ${secondUser}`);

//     // Clean up in-call users
//     inCallUsers.delete(email);
//     inCallUsers.delete(secondUser);

//     // Re-add the skipping user to the queue
//     if (!waitingQueue.find(u => u.email === email)) {
//       waitingQueue.push({ email, socketId: socket.id });
//     }

//     pairUsers();
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

//! Working Code 
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

// const pool = new Pool({
//   connectionString: "postgresql://dilkash:LLZTQ4MBZOr52aioxpG6FSWStDvCpgV1@dpg-d0un9j3ipnbc73ej7vag-a.oregon-postgres.render.com/videochat_ilcb",
//   ssl: { rejectUnauthorized: false },
// });

// (async () => {
//   try {
//     const conn = await pool.connect();
//     console.log('✅ PostgreSQL Connected');
//     conn.release();
//   } catch (err) {
//     console.error('❌ PostgreSQL Connection Error:', err);
//   }
// })();

// app.use((req, res, next) => {
//   req.db = pool;
//   next();
// });

// app.use('/api/auth', authRoutes);

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// let isPairingInProgress = false;
// const userSkipCounts = new Map(); // email -> { count, lastSkippedAt }

// const users = {}; // email -> socket.id
// const waitingQueue = [];
// const emailToSocketIdMap = new Map();
// const onlineUsers = new Set();
// const inCallUsers = new Set();
// const connectingUsers = new Set();
// const emailMap = {};       // socket.id => email
// const userSocketMap = {};  // email => socket.id
// const pairs = {};
// const callTimeouts = new Map();

// app.get('/api/online-users', (req, res) => {
//   const onlineUsers = Array.from(emailToSocketIdMap.keys());
//   res.json({ onlineUsers });
// });

// // setInterval(() => {
// //   console.log('📡 Online Users:', Array.from(emailToSocketIdMap.entries()));
// // }, 3000);

// function getEmailBySocketId(socketId) {
//   return Object.keys(users).find(email => users[email] === socketId);
// }

// function pairUsers() {
//   if (isPairingInProgress || waitingQueue.length < 2) return;
//   isPairingInProgress = true;

//   const availableUsers = waitingQueue.filter(u =>
//     !inCallUsers.has(u.email) && !connectingUsers.has(u.email)
//   );

//   waitingQueue.length = 0;
//   waitingQueue.push(...availableUsers);

//   while (waitingQueue.length >= 2) {
//     const user1 = waitingQueue.shift();
//     const user2 = waitingQueue.shift();
//     if (user1.email === user2.email) {
//       console.warn("🛑 Attempted to pair user with self. Skipping.");
//       continue; // Skip this pairing and try next
//     }

//     connectingUsers.add(user1.email);
//     connectingUsers.add(user2.email);
//     inCallUsers.add(user1.email);
//     inCallUsers.add(user2.email);
//     pairs[user1.email] = user2.email;
//     pairs[user2.email] = user1.email;

//     emailMap[user1.socketId] = user1.email;
//     emailMap[user2.socketId] = user2.email;

//     userSocketMap[user1.email] = user1.socketId;
//     userSocketMap[user2.email] = user2.socketId;

//     console.log(`🔗 Pairing ${user1.email} with ${user2.email}`);

//     io.to(user1.socketId).emit("matched:pair", {
//       peer: user2.email,
//       peerSocketId: user2.socketId,
//     });

//     setTimeout(() => {
//       io.to(user2.socketId).emit("matched:pair", {
//         peer: user1.email,
//         peerSocketId: user1.socketId,
//         delay: true
//       });
//     }, 7000);
//   }

//   isPairingInProgress = false;
// }

// io.on("connection", (socket) => {
//   console.log("🔌 New connection:", socket.id);

//   socket.on("user:online", ({ email }) => {
//     if (email) {
//       userSocketMap[email] = socket.id;
//       console.log(`✅ User ${email} is online with socket ${socket.id}`);
//     }


//     users[email] = socket.id;
//     userSocketMap[email] = socket.id;
//     console.log(`✅ ${email} is online as ${socket.id}`);
//     io.emit("online:users", Object.keys(users).map(email => ({ email })));
//   });

//   socket.on("user:ready", ({ email }) => {
//     if (inCallUsers.has(email)) return;

//     users[email] = socket.id;
//     const alreadyInQueue = waitingQueue.find(u => u.email === email);
//     if (!alreadyInQueue) {
//       waitingQueue.push({ email, socketId: socket.id });
//       console.log(`🕒 ${email} added to waiting queue.`);
//     }

//     pairUsers();

//     setTimeout(() => {
//       if (!inCallUsers.has(email)) {
//         const stillInQueue = waitingQueue.find(u => u.email === email);
//         if (!stillInQueue) {
//           waitingQueue.push({ email, socketId: socket.id });
//           pairUsers();
//         }
//       }
//     }, 15000);
//   });

//   socket.on("user:call", ({ to, offer }) => {

//     const targetSocketId = users[to];
//     const fromEmail = getEmailBySocketId(socket.id);

//     if (!targetSocketId || !fromEmail) return;

//     console.log(`📞 ${fromEmail} is calling ${to}`);
//     io.to(targetSocketId).emit("incoming:call", { from: fromEmail, offer });
//     const timeoutKey = `${fromEmail}-${to}`;
//     // ⏰ Add timeout for unanswered call
//     const timeout = setTimeout(() => {
//       console.log(`⏰ Call between ${fromEmail} and ${to} timed out`);

//       // Cleanup and requeue both users
//       connectingUsers.delete(fromEmail);
//       connectingUsers.delete(to);

//       const fromSocketId = users[fromEmail];
//       const toSocketIdNow = users[to]; // Might have changed

//       if (fromSocketId) waitingQueue.push({ email: fromEmail, socketId: fromSocketId });
//       if (toSocketIdNow) waitingQueue.push({ email: to, socketId: toSocketIdNow });

//       io.to(fromSocketId).emit("call:timeout", { peer: to });
//       if (toSocketIdNow) io.to(toSocketIdNow).emit("call:timeout", { peer: fromEmail });

//       pairUsers();
//       callTimeouts.delete(timeoutKey); // Retry pairing
//     }, 20000); // 20s timeout

//     // Store timeout reference so it can be cleared if accepted
//     callTimeouts.set(timeoutKey, timeout);

//   });

//   socket.on("call:accepted", ({ to, ans }) => {
//     const targetSocketId = users[to];
//     const fromEmail = getEmailBySocketId(socket.id);
//     const timeoutKey = `${to}-${fromEmail}`;
//     const timeout = callTimeouts.get(timeoutKey);
//     if (timeout) {
//       clearTimeout(timeout);
//       callTimeouts.delete(timeoutKey);
//     }
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call:accepted", { ans });

//       // ✅ Cleanup on success
//       clearTimeout(socket.callTimeout);
//       connectingUsers.delete(fromEmail);
//       connectingUsers.delete(to);
//       inCallUsers.add(fromEmail);
//       inCallUsers.add(to);

//       io.emit("online:users", Object.keys(users).map(email => ({ email })));
//       pairUsers();
//     }
//   });

//   socket.on('send-message', data => {
//     const targetSocketId = userSocketMap[data.to];

//     console.log("🔁 userSocketMap:", userSocketMap);
//     console.log("🧾 Received message data:", data);
//     console.log("🎯 Target socket ID:", targetSocketId);

//     if (targetSocketId) {
//       io.to(targetSocketId).emit('receive-message', data);
//     } else {
//       console.log("⚠️ Target socket ID not found for", data.to);
//     }

//   });


//   socket.on("user:leave", ({ email, secondUser }) => {
//     const now = Date.now();
//     const skipData = userSkipCounts.get(email) || { count: 0, lastSkippedAt: 0 };

//     if (now - skipData.lastSkippedAt > 10 * 60 * 1000) {
//       skipData.count = 0;
//     }
//     if (skipData.count >= 5) {
//       socket.emit("skip:disabled", { cooldown: 10 * 60 }); // 10 minutes in seconds
//       return;
//     }

//     skipData.count++;
//     skipData.lastSkippedAt = now;
//     userSkipCounts.set(email, skipData);

//     console.log(`⏩ ${email} skipped ${secondUser} (${skipData.count} skips)`);
//     // console.log(`⏩ ${email} skipped ${secondUser}`);

//     if (email) {
//       delete users[email];
//       inCallUsers.delete(email);
//       inCallUsers.delete(secondUser);
//       connectingUsers.delete(email);
//       connectingUsers.delete(secondUser);
//     }

//     const secondUserSocketId = userSocketMap[secondUser];
//     if (secondUserSocketId) {
//       io.to(secondUserSocketId).emit("peer:disconnected", { by: email });
//     }

//     if (!waitingQueue.find(u => u.email === email)) {
//       waitingQueue.push({ email, socketId: socket.id });
//     }

//     pairUsers();
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
//       connectingUsers.delete(email);

//       const index = waitingQueue.findIndex(user => user.email === email);
//       if (index !== -1) {
//         waitingQueue.splice(index, 1);
//       }

//       io.emit("online:users", Object.keys(users).map(email => ({ email })));
//       pairUsers();
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


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
// const pool = new Pool({
//   connectionString: "postgresql://dilkash:LLZTQ4MBZOr52aioxpG6FSWStDvCpgV1@dpg-d0un9j3ipnbc73ej7vag-a.oregon-postgres.render.com/videochat_ilcb",
//   ssl: { rejectUnauthorized: false },
// });
// (async () => {
//   try {
//     const conn = await pool.connect();
//     console.log('✅ PostgreSQL Connected');
//     conn.release();
//   } catch (err) {
//     console.error('❌ PostgreSQL Connection Error:', err);
//   }
// })();
// app.use((req, res, next) => {
//   req.db = pool;
//   next();
// });
// app.use('/api/auth', authRoutes);
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });
// const userSkipCounts = new Map(); // email -> { count, lastSkippedAt }
// const onlineUsers = new Set(); // just email list
// const userSocketMap = {};      // email -> socketId
// const socketEmailMap = {};     // socketId -> email
// const waitingQueue = [];
// const inCallUsers = new Set();
// const connectingUsers = new Set();      // socket.id => email
// const pairs = {};
// const callTimeouts = new Map();
// app.get('/api/online-users', (req, res) => {
//   const onlineUsersArr = Array.from(onlineUsers);
//   res.json({ onlineUsers: onlineUsersArr });
// });

// function getEmailBySocketId(socketId) {
//   return socketEmailMap[socketId];
// }


// async function isBlocked(user1, user2, db) {
//   const result = await db.query(
//     `SELECT 1 FROM blocked_users WHERE 
//       (blocked_by = $1 AND blocked_user = $2) OR 
//       (blocked_by = $2 AND blocked_user = $1)`,
//     [user1, user2]
//   );
//   return result.rowCount > 0;
// }


// async function pairUsers() {
//   if (waitingQueue.length < 2) return;
//   const availableUsers = waitingQueue.filter(u =>
//     !inCallUsers.has(u.email) && !connectingUsers.has(u.email)
//   );
//   waitingQueue.length = 0;
//   waitingQueue.push(...availableUsers);
//   while (waitingQueue.length >= 2) {
//     const user1 = waitingQueue.shift();
//     let user2 = null;
//     for (let i = 0; i < waitingQueue.length; i++) {
//       const candidate = waitingQueue[i];
//       const isMatch =
//         !(await isBlocked(user1.email, candidate.email, pool)) &&
//         (user1.preference === "any" || user1.preference === candidate.gender) &&
//         (candidate.preference === "any" || candidate.preference === user1.gender);

//       if (isMatch) {
//         user2 = waitingQueue.splice(i, 1)[0];
//         break;
//       }
//     }

//     if (!user2) {
//       waitingQueue.unshift(user1);
//       break;
//     }

//     if (user1.email === user2.email) continue;
//     connectingUsers.add(user1.email);
//     connectingUsers.add(user2.email);
//     inCallUsers.add(user1.email);
//     inCallUsers.add(user2.email);
//     pairs[user1.email] = user2.email;
//     pairs[user2.email] = user1.email;
//     userSocketMap[user1.email] = user1.socketId;
//     userSocketMap[user2.email] = user2.socketId;
//     console.log(`🔗 Pairing ${user1.email} (${user1.gender}) with ${user2.email} (${user2.gender})`);
//     io.to(user1.socketId).emit("matched:pair", {
//       peer: user2.email,
//       peerSocketId: user2.socketId,
//     });
//     setTimeout(() => {
//       io.to(user2.socketId).emit("matched:pair", {
//         peer: user1.email,
//         peerSocketId: user1.socketId,
//         delay: true,
//       });
//     }, 7000);
//   }
// }


// io.on("connection", (socket) => {
//   console.log("🔌 New connection:", socket.id);
//   socket.on("user:online", ({ email }) => {
//     if (email) {
//       userSocketMap[email] = socket.id;
//       console.log(`✅ User ${email} is online with socket ${socket.id}`);
//     }
//     onlineUsers.add(email);
//     socketEmailMap[socket.id] = email;
//     console.log(`✅ ${email} is online as ${socket.id}`);
//     io.emit("online:users", Array.from(onlineUsers).map(email => ({ email })));
//   });






//   socket.on("user:ready", ({ email, gender, preference }) => {
//     if (inCallUsers.has(email)) return;

//     userSocketMap[email] = socket.id;

//     const alreadyInQueue = waitingQueue.find(u => u.email === email);
//     if (!alreadyInQueue) {
//       waitingQueue.push({ email, socketId: socket.id, gender, preference });
//       console.log(`🕒 ${email} added to waiting queue.`);
//     }
//     pairUsers();

//     setTimeout(() => {
//       if (!inCallUsers.has(email)) {
//         const stillInQueue = waitingQueue.find(u => u.email === email);
//         if (!stillInQueue) {
//           waitingQueue.push({ email, socketId: socket.id, gender, preference });
//           pairUsers();
//         }
//       }
//     }, 15000);
//   });







//   socket.on("user:call", ({ to, offer }) => {
//     const targetSocketId = userSocketMap[to];
//     const fromEmail = getEmailBySocketId(socket.id);
//     if (!targetSocketId || !fromEmail) return;
//     console.log(`📞 ${fromEmail} is calling ${to}`);
//     io.to(targetSocketId).emit("incoming:call", { from: fromEmail, offer });
//     const timeoutKey = `${fromEmail}-${to}`;
//     // ⏰ Add timeout for unanswered call
//     const timeout = setTimeout(() => {
//       console.log(`⏰ Call between ${fromEmail} and ${to} timed out`);
//       // Cleanup and requeue both users
//       connectingUsers.delete(fromEmail);
//       connectingUsers.delete(to);
//       const fromSocketId = userSocketMap[fromEmail];
//       const toSocketIdNow = userSocketMap[to]; // Might have changed
//       if (fromSocketId) waitingQueue.push({ email: fromEmail, socketId: fromSocketId });
//       if (toSocketIdNow) waitingQueue.push({ email: to, socketId: toSocketIdNow });
//       io.to(fromSocketId).emit("call:timeout", { peer: to });
//       if (toSocketIdNow) io.to(toSocketIdNow).emit("call:timeout", { peer: fromEmail });
//       pairUsers();
//       callTimeouts.delete(timeoutKey); // Retry pairing
//     }, 20000); // 20s timeout
//     // Store timeout reference so it can be cleared if accepted
//     callTimeouts.set(timeoutKey, timeout);
//   });







//   socket.on("call:accepted", ({ to, ans }) => {
//     const targetSocketId = userSocketMap[to];
//     const fromEmail = getEmailBySocketId(socket.id);
//     const timeoutKey = `${to}-${fromEmail}`;
//     const timeout = callTimeouts.get(timeoutKey);
//     if (timeout) {
//       clearTimeout(timeout);
//       callTimeouts.delete(timeoutKey);
//     }
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call:accepted", { ans });
//       clearTimeout(socket.callTimeout);
//       connectingUsers.delete(fromEmail);
//       connectingUsers.delete(to);
//       inCallUsers.add(fromEmail);
//       inCallUsers.add(to);
//       io.emit("online:users", Array.from(onlineUsers).map(email => ({ email })));
//       pairUsers();
//     }
//   });








//   socket.on('send-message', data => {
//     const targetSocketId = userSocketMap[data.to];
//     console.log("🔁 userSocketMap:", userSocketMap);
//     console.log("🧾 Received message data:", data);
//     console.log("🎯 Target socket ID:", targetSocketId);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit('receive-message', data);
//     } else {
//       console.log("⚠️ Target socket ID not found for", data.to);
//     }
//   });








//   socket.on("user:leave", async ({ email, secondUser, gender }) => {
//     if (gender === "male") {
//       if (!isPremium) {
//         const now = Date.now();
//         const skipData = userSkipCounts.get(email) || { count: 0, lastSkippedAt: 0 };
//         if (now - skipData.lastSkippedAt > 10 * 60 * 1000) {
//           skipData.count = 0;
//         }
//         if (skipData.count >= 5) {
//           socket.emit("skip:disabled", { cooldown: 10 * 60 }); // 10 minutes
//           return;
//         }
//         skipData.count++;
//         skipData.lastSkippedAt = now;
//         userSkipCounts.set(email, skipData);
//         console.log(`⏩ ${email} skipped ${secondUser} (${skipData.count} skips)`);
//       } else {
//         console.log(`💎 ${email} (premium) skipped ${secondUser} (unlimited skips)`);
//       }
//     } else {
//       console.log(`⏩ ${email} skipped ${secondUser} (female - no counter)`);
//     }
//     if (email) {
//       onlineUsers.delete(email);
//       delete userSocketMap[email];
//       delete socketEmailMap[socket.id];
//       inCallUsers.delete(email);
//       inCallUsers.delete(secondUser);
//       connectingUsers.delete(email);
//       connectingUsers.delete(secondUser);
//     }
//     const secondUserSocketId = userSocketMap[secondUser];
//     if (secondUserSocketId) {
//       io.to(secondUserSocketId).emit("peer:disconnected", { by: email });
//     }
//     if (!waitingQueue.find(u => u.email === email)) {
//       waitingQueue.push({ email, socketId: socket.id });
//     }
//     pairUsers();
//   });









//   socket.on("peer:nego:needed", ({ to, offer }) => {
//     const targetSocketId = userSocketMap[to];
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("peer:nego:needed", { from: getEmailBySocketId(socket.id), offer });
//     }
//   });
//   socket.on("peer:nego:done", ({ to, ans }) => {
//     const targetSocketId = userSocketMap[to];
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("peer:nego:final", { ans });
//     }
//   });
//   socket.on("disconnect", () => {
//     const email = getEmailBySocketId(socket.id);
//     console.log(`❌ Disconnected: ${email || socket.id}`);
//     if (email) {
//       onlineUsers.delete(email);
//       delete userSocketMap[email];
//       delete socketEmailMap[socket.id];
//       inCallUsers.delete(email);
//       connectingUsers.delete(email);
//       const index = waitingQueue.findIndex(user => user.email === email);
//       if (index !== -1) {
//         waitingQueue.splice(index, 1);
//       }
//       io.emit("online:users", Array.from(onlineUsers).map(email => ({ email })));
//       pairUsers();
//     }
//   });
// });
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



//old pair users function 






// const pairUsers = async () => {
//   let available = waitingQueue.filter(u =>
//     !inCallUsers.has(u.email) &&
//     !connectingUsers.has(u.email)
//   );

//   waitingQueue.length = 0; // Clear and rebuild queue after filtering
//   waitingQueue.push(...available);

//   let paired = new Set(); // Prevent re-pairing within this cycle

//   for (let i = 0; i < waitingQueue.length - 1; i++) {
//     const user1 = waitingQueue[i];
//     if (paired.has(user1.email)) continue;

//     for (let j = i + 1; j < waitingQueue.length; j++) {
//       const user2 = waitingQueue[j];
//       if (paired.has(user2.email)) continue;

//       const canPair = !(await isBlocked(user1.email, user2.email)) &&
//         (user1.preference === 'any' || user1.preference === user2.gender) &&
//         (user2.preference === 'any' || user2.preference === user1.gender);

//       if (canPair) {
//         [user1.email, user2.email].forEach(email => {
//           inCallUsers.add(email);
//           connectingUsers.add(email);
//           paired.add(email);
//         });

//         io.to(user1.socketId).emit("matched:pair", {
//           peer: user2.email,
//           peerSocketId: user2.socketId
//         });

//         setTimeout(() => {
//           io.to(user2.socketId).emit("matched:pair", {
//             peer: user1.email,
//             peerSocketId: user1.socketId,
//             delay: true
//           });
//         }, 7000);
//         break; // move to next user1
//       }
//     }
//   }

// After pairing, update the waitingQueue to keep unmatched users
//   waitingQueue.length = 0;
//   for (let user of available) {
//     if (!paired.has(user.email)) waitingQueue.push(user);
//   }
// };




import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// --- PostgreSQL Setup ---
const { Pool } = pkg;
const pool = new Pool({
  connectionString: "postgresql://dilkash:LLZTQ4MBZOr52aioxpG6FSWStDvCpgV1@dpg-d0un9j3ipnbc73ej7vag-a.oregon-postgres.render.com/videochat_ilcb" || "your-fallback-url",
  ssl: { rejectUnauthorized: false },
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

app.use((req, res, next) => {
  req.db = pool;
  next();
});
app.use('/api/auth', authRoutes);

// --- Global In-Memory Store ---
const userSocketMap = new Map();
const socketEmailMap = new Map();
const waitingQueue = [];
const inCallUsers = new Set();
const connectingUsers = new Set();
const userSkipCounts = new Map();
const callTimeouts = new Map();
const lastTriedWith = {};

// --- Utility Functions ---
const getEmail = socketId => socketEmailMap.get(socketId);
const getSocketId = email => userSocketMap.get(email);

const isBlocked = async (user1, user2) => {
  const res = await pool.query(`
    SELECT 1 FROM blocked_users 
    WHERE (blocker = $1 AND blocked = $2) OR (blocker = $2 AND blocked = $1)`,
    [user1, user2]
  );
  return res.rowCount > 0;
};



const gendersMatch = (a, b) => {
  const aOk = a.preference === 'any' || a.preference === b.gender;
  const bOk = b.preference === 'any' || b.preference === a.gender;
  return aOk && bOk;
};

const pairUsers = async () => {
  let available = waitingQueue.filter(u =>
    !inCallUsers.has(u.email) &&
    !connectingUsers.has(u.email)
  );

  waitingQueue.length = 0;
  waitingQueue.push(...available);

  const paired = new Set();

  for (let i = 0; i < waitingQueue.length - 1; i++) {
    const user1 = waitingQueue[i];
    if (paired.has(user1.email)) continue;

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const user2 = waitingQueue[j];
      if (paired.has(user2.email)) continue;

      if (user1.email === lastTriedWith[user2.email]) continue;
      const canPair = !(await isBlocked(user1.email, user2.email)) && gendersMatch(user1, user2);

      if (canPair) {
        [user1.email, user2.email].forEach(email => {
          inCallUsers.add(email);
          connectingUsers.add(email);
          paired.add(email);
        });

        userSocketMap.set(user1.email, user1.socketId);
        userSocketMap.set(user2.email, user2.socketId);

        lastTriedWith[user1.email] = user2.email;
        lastTriedWith[user2.email] = user1.email;

        io.to(user1.socketId).emit("matched:pair", {
          peer: user2.email,
          peerSocketId: user2.socketId
        });

        setTimeout(() => {
          io.to(user2.socketId).emit("matched:pair", {
            peer: user1.email,
            peerSocketId: user1.socketId,
            delay: true
          });
        }, 7000);

        break; // go to next user1
      }
    }
  }

  waitingQueue.length = 0;
  for (let user of available) {
    if (!paired.has(user.email)) waitingQueue.push(user);
  }
};



// --- Express Endpoint ---
app.get('/api/online-users', (req, res) => {
  res.json({ onlineUsers: Array.from(userSocketMap.keys()) });
});

// --- Socket.IO ---
io.on("connection", socket => {
  console.log("🔌 Connected:", socket.id);

  socket.on("user:online", ({ email }) => {
    if (!email) return;
    userSocketMap.set(email, socket.id);
    socketEmailMap.set(socket.id, email);
    io.emit("online:users", Array.from(userSocketMap.keys()).map(email => ({ email })));
  });

  socket.on("user:ready", async ({ email, gender, preference }) => {
    if (inCallUsers.has(email)) return;

    if (!waitingQueue.some(u => u.email === email)) {
      waitingQueue.push({ email, socketId: socket.id, gender, preference });
    }

    await pairUsers();

    setTimeout(async () => {
      if (!inCallUsers.has(email) && !waitingQueue.some(u => u.email === email)) {
        waitingQueue.push({ email, socketId: socket.id, gender, preference });
        await pairUsers();
      }
    }, 15000);
  });

  socket.on("user:call", ({ to, offer }) => {
    const from = getEmail(socket.id);
    const targetSocket = getSocketId(to);
    if (!from || !targetSocket) return;

    const timeoutKey = `${from}-${to}`;
    callTimeouts.set(timeoutKey, setTimeout(() => {
      console.log(`⏰ Call timeout between ${from} and ${to}`);
      [from, to].forEach(user => connectingUsers.delete(user));
      [from, to].forEach(email => {
        const sid = getSocketId(email);
        if (sid) waitingQueue.push({ email, socketId: sid });
      });
      io.to(getSocketId(from)).emit("call:timeout", { peer: to });
      io.to(getSocketId(to)).emit("call:timeout", { peer: from });
      callTimeouts.delete(timeoutKey);
      pairUsers();
    }, 2000));

    io.to(targetSocket).emit("incoming:call", { from, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    const from = getEmail(socket.id);
    const toSocket = getSocketId(to);
    const timeoutKey = `${to}-${from}`;
    clearTimeout(callTimeouts.get(timeoutKey));
    callTimeouts.delete(timeoutKey);
    [from, to].forEach(email => {
      inCallUsers.add(email);
      connectingUsers.delete(email);
    });
    if (toSocket) {
      io.to(toSocket).emit("call:accepted", { ans });
    }
    io.emit("online:users", Array.from(userSocketMap.keys()).map(email => ({ email })));
  });


  socket.on("send-message", data => {
    const targetSocket = getSocketId(data.to);
    if (targetSocket) io.to(targetSocket).emit("receive-message", data);
  });


  socket.on("user:leave", ({ email, secondUser, gender, isPremium }) => {
    const sidEmail = getEmail(socket.id); // ✅ avoid name conflict

    if (sidEmail) {
      userSocketMap.delete(sidEmail);
      inCallUsers.delete(sidEmail);
      connectingUsers.delete(sidEmail);
      const idx = waitingQueue.findIndex(u => u.email === sidEmail);
      if (idx !== -1) waitingQueue.splice(idx, 1);
    }

    socketEmailMap.delete(socket.id);

    io.emit("online:users", Array.from(userSocketMap.keys()).map(email => ({ email })));

    pairUsers();
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    const targetSocket = getSocketId(to);
    if (targetSocket) io.to(targetSocket).emit("peer:nego:needed", { from: getEmail(socket.id), offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    const targetSocket = getSocketId(to);
    if (targetSocket) io.to(targetSocket).emit("peer:nego:final", { ans });
  });

  socket.on("disconnect", () => {
    const email = getEmail(socket.id);
    if (email) {
      userSocketMap.delete(email);
      inCallUsers.delete(email);
      connectingUsers.delete(email);
      const idx = waitingQueue.findIndex(u => u.email === email);
      if (idx !== -1) waitingQueue.splice(idx, 1);
    }
    socketEmailMap.delete(socket.id);
    io.emit("online:users", Array.from(userSocketMap.keys()).map(email => ({ email })));
    pairUsers();
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
