// .env dosyasını yükle
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import quizRoutes from './routes/quizRoutes';
import auraRoutes from './routes/auraRoutes';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/aura', auraRoutes);

// Basit loglama API'si eklendi - 404 hatalarını çözmek için
app.post('/api/log/:action', (req, res) => {
  const { action } = req.params;
  logger.info(`Loglama isteği alındı: ${action}`, req.body);
  res.status(200).json({ success: true });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Sunucu hatası oluştu',
      code: err.code || 'SERVER_ERROR'
    }
  });
});

export default app; 