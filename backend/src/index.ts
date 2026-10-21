import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { prisma } from './prisma';
import { errorHandler, notFoundHandler } from './middleware/error';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import subjectRoutes from './routes/subjects';
import taskRoutes from './routes/tasks';
import sessionRoutes from './routes/sessions';
import statsRoutes from './routes/stats';
import settingsRoutes from './routes/settings';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (!config.isProd) app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', requireAuth, subjectRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api/sessions', requireAuth, sessionRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`FocusForge API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
