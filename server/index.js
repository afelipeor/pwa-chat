const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Debug: Check if environment variables are loaded
console.log('🔧 Environment check:');
console.log(
  'MONGODB_URI:',
  process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'
);
console.log(
  'JWT_SECRET:',
  process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'
);
console.log(
  'VAPID_PUBLIC_KEY:',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Missing'
);
console.log(
  'VAPID_PRIVATE_KEY:',
  process.env.VAPID_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'
);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    vapidConfigured: !!(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    ),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
