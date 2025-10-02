import express from 'express';

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Test server is working!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal test server' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
