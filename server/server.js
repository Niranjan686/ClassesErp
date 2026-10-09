const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server setting warning:', e.message);
}

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

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
  // Join institute specific room
  socket.on('join_institute', (instituteId) => {
    if (instituteId) {
      socket.join(`inst_${instituteId}`);
    }
  });

  // Join batch room
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'OK' : 'DEGRADED',
    app: 'Coaching Classes & Tuition Institute Multi-Tenant SaaS ERP API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: {
      state: isConnected ? 'Connected to MongoDB Atlas' : 'Connecting / Disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'Atlas Cluster'
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

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI;

console.log('----------------------------------------------------');
console.log('Connecting to MongoDB Atlas for Multi-Tenant ERP...');
console.log('----------------------------------------------------');

const connectWithRetry = () => {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  })
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully to database:', mongoose.connection.name || 'SchoolErp');
  })
  .catch((err) => {
    console.error('⚠️ MongoDB Atlas connection notice:', err.message);
  });
};

connectWithRetry();

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Multi-Tenant SaaS ERP Server & Socket.IO active on port ${PORT}`);
});
