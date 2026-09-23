import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSessionMiddleware } from './config/session.js';
import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import reporterRoutes from './routes/reporterRoutes.js';
import editorRoutes from './routes/editorRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

export function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(currentDirectory, 'views'));
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(express.static(path.join(currentDirectory, 'public')));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(createSessionMiddleware());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/reporter', reporterRoutes);
  app.use('/api/editor', editorRoutes);
  app.use('/api/users', userRoutes);

  app.use('/', pageRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
