import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';
import employeesRouter from './modules/employees/employees.routes';
import assetsRouter from './modules/assets/assets.routes';
import simsRouter from './modules/sims/sims.routes';
import credentialsRouter from './modules/credentials/credentials.routes';
import projectsRouter from './modules/projects/projects.routes';
import tasksRouter from './modules/tasks/tasks.routes';
import todosRouter from './modules/todos/todos.routes';
import filesRouter from './modules/files/files.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import auditRouter from './modules/audit/audit.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import ticketsRouter from './modules/tickets/tickets.routes';

import { errorHandler } from './shared/middleware/error.middleware';
import { requestLogger } from './shared/middleware/logger.middleware';
import { authenticate } from './shared/middleware/auth.middleware';

const app = express();

// ── Security ──────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate Limiting ─────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// ── Body Parsing ──────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use(requestLogger);

// ── Static Files ──────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'OK',
  version: '2.0.0',
  timestamp: new Date().toISOString()
}));

// ── API Routes ────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/employees', authenticate, employeesRouter);
app.use('/api/assets', authenticate, assetsRouter);
app.use('/api/sims', authenticate, simsRouter);
app.use('/api/credentials', authenticate, credentialsRouter);
app.use('/api/projects', authenticate, projectsRouter);
app.use('/api/tasks', authenticate, tasksRouter);
app.use('/api/todos', authenticate, todosRouter);
app.use('/api/files', authenticate, filesRouter);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/audit', authenticate, auditRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/tickets', authenticate, ticketsRouter);

// ── Error Handler ─────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 OpsFlow ERP v2 running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}\n`);
});

export default app;
