import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app
  .listen(PORT, () => {
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
    console.log('='.repeat(60) + '\n');
  })
  .on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error('💡 Kill existing process: taskkill /F /IM node.exe\n');
      process.exit(1);
    }
    throw err;
  });

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close();
  process.exit(0);
});
