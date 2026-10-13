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

// Bulletproof CORS Configuration (Supports Vercel cross-origin deployments & mobile apps)
const allowedOrigins = [
  'https://classes-erp.vercel.app',
  'https://classes-erp-i3yt.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:8081',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback: allow dynamically
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'Accept-Version',
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Explicit Edge / Reverse Proxy Preflight & Header Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Accept-Version'
  );

  // Immediately resolve preflight OPTIONS requests without waiting for DB or subsequent middlewares
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serverless DB Auto-Connect Middleware (Skip for OPTIONS preflight to prevent timeouts)
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
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
const fileVaultRoutes = require('./routes/fileVaultRoutes');
const quizRoutes = require('./routes/quizRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const transportRoutes = require('./routes/transportRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const gatePassRoutes = require('./routes/gatePassRoutes');
const studentDocumentRoutes = require('./routes/studentDocumentRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const saasSubscriptionRoutes = require('./routes/saasSubscriptionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const supportRoutes = require('./routes/supportRoutes');

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
app.use('/api/vault', fileVaultRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/gatepass', gatePassRoutes);
app.use('/api/documents', studentDocumentRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/saas', saasSubscriptionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/support', supportRoutes);

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

// Initial startup connection (Local Node.js only; Vercel connects per request middleware)
if (!process.env.VERCEL) {
  connectDB().catch((err) => {
    console.error('Initial DB connect attempt notice:', err.message);
  });
}

// Start the server if run directly (Node.js) - Never listen inside Vercel serverless functions
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Multi-Tenant SaaS ERP Server & Socket.IO active on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
