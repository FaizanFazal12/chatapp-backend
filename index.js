// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// === CORS Config ===
const allowedOrigin = 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  }
});

// === Create uploads directory if it doesn't exist ===
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// === Middleware ===
// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Log cookies for debugging (optional)
app.use((req, res, next) => {
  console.log('🍪 Cookies:', req.cookies);
  next();
});

// === Routes ===
app.use('/api', require('./routes'));

// === Error Handler ===
app.use(errorHandler);

// === Socket.IO Setup ===
setupSocket(io);

// === Start Server ===
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
