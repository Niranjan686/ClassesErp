const dns = require('dns');
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const connectDB = require('./utils/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_institute', (instituteId) => {
    if (instituteId) {
      socket.join(`inst_${instituteId}`);
    }
  });

  socket.on('join_batch', (batchId) => {
    if (batchId) {
      socket.join(`batch_${batchId}`);
    }
  });
});

// Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serverless DB Auto-Connect Middleware (Guarantees DB is ready before request executes)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connection middleware error:', err.message);
  }
  next();
});

// Route handlers
const authRoutes = require('./routes/auth');
const instituteRoutes = require('./routes/instituteRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const noteRoutes = require('./routes/noteRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const demoRoutes = require('./routes/demoRoutes');
const examRoutes = require('./routes/examRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const staffRoutes = require('./routes/staffRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/demos', demoRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ai', aiRoutes);

// Health check & Server Status endpoints (Awaits DB connection for serverless environments)
app.get(['/', '/api/health', '/api/status', '/api/ping'], async (req, res) => {
  try {
    await connectDB();
  } catch (e) {}

  const isConnected = mongoose.connection.readyState === 1;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  
  res.json({
    success: isConnected,
    status: isConnected ? 'HEALTHY' : 'DEGRADED',
    message: isConnected 
      ? 'ClassTech Multi-Tenant Educational SaaS ERP Backend is running 🚀' 
      : 'Server is running, connecting to MongoDB Atlas...',
    version: '2.0.0',
    port: process.env.PORT || 5000,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      state: isConnected ? 'Connected to MongoDB Atlas' : 'Connecting / Disconnected',
      status: states[mongoose.connection.readyState] || 'Unknown',
      readyState: mongoose.connection.readyState,
      connected: isConnected,
      name: mongoose.connection.name || 'SchoolErp',
      host: mongoose.connection.host || 'Atlas Cluster',
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initial startup connection
connectDB().catch((err) => {
  console.error('Initial DB connect attempt notice:', err.message);
});

// Start the server if run directly (Node.js)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Multi-Tenant SaaS ERP Server & Socket.IO active on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
