import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';

import coursesRouter from './routes/courses';
import assignmentsRouter from './routes/assignments';
import checkinsRouter from './routes/checkins';
import todosRouter from './routes/todos';
import notificationsRouter from './routes/notifications';
import statsRouter from './routes/stats';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

// API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/stats', statsRouter);

// SPA Fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

app.use(errorHandler as ErrorRequestHandler);

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
});

export default app;
