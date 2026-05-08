require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const db = require('./models');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startOverdueCron } = require('./jobs/overdueDetection');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const tasksStandaloneRoutes = require('./modules/tasks/tasks.standalone.routes');
const { taskCommentRouter, commentRouter } = require('./modules/comments/comments.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects/:id/tasks', tasksRoutes);
app.use('/api/tasks', tasksStandaloneRoutes);
app.use('/api/tasks/:id/comments', taskCommentRouter);
app.use('/api/comments', commentRouter);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await db.connect();
    await db.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database synced');

    if (process.env.NODE_ENV !== 'test') {
      startOverdueCron();
      app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
