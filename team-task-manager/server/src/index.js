require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { Server } = require('socket.io');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://incandescent-croissant-ab8fd9.netlify.app',
      'https://ethara-assessment-sage.vercel.app',
      'https://ethara-assessment-2wuw37zwu-atulchakwas-projects.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'Origin', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

const server = app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'https://incandescent-croissant-ab8fd9.netlify.app',
        'https://ethara-assessment-sage.vercel.app',
        'https://ethara-assessment-2wuw37zwu-atulchakwas-projects.vercel.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174'
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });
  
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });
  
  socket.on('disconnect', () => {
  });
});

module.exports = { app, io };