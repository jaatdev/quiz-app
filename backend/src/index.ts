import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import routes from './routes';
import { getUploadsDir, getNotesDir, resolveAbsoluteFromUrl } from './utils/uploads';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const uploadsDir = getUploadsDir();
const notesDir = getNotesDir();

// CORS configuration for production
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || '', 'https://vercel.app', /\.vercel\.app$/]
      : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.get(/^\/uploads\/(.+)/, async (req, res) => {
  const requestedPath = (req.params as unknown as string[])[0] ?? '';
  const urlPath = `/uploads/${requestedPath}`;

  try {
    const absolutePath = resolveAbsoluteFromUrl(urlPath);
    await fs.promises.access(absolutePath, fs.constants.R_OK);
    console.log(`[uploads] Serving ${urlPath} -> ${absolutePath}`);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.warn(`[uploads] Missing file for ${urlPath}`, error);
    return res.status(404).json({ error: 'File not found' });
  }
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Quiz API Server running on http://localhost:' + PORT);
  console.log('='.repeat(60));
  console.log('\n📚 Available Endpoints:');
  console.log('   GET  /api/health              - Health check');
  console.log('   GET  /api/subjects            - Get all subjects with topics');
  console.log('   GET  /api/topics/:topicId     - Get topic details');
  console.log('   GET  /api/quiz/session/:topicId?count=10 - Start quiz');
  console.log('   POST /api/quiz/submit         - Submit quiz answers');
  console.log('   POST /api/quiz/review         - Get review questions');
  console.log('='.repeat(60));
  console.log(`📂 Uploads directory: ${uploadsDir}`);
  console.log(`📄 Notes directory:   ${notesDir}`);
  console.log('='.repeat(60) + '\n');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close();
  process.exit(0);
});
