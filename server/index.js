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

// Silence Chrome DevTools and Next.js development requests
app.use((req, res, next) => {
  const silentPaths = [
    '/.well-known/',
    '/_next/static/',
    '/_next/webpack-hmr',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/workbox-',
    '/__nextjs_original-stack-frame',
  ];

  const shouldSilence = silentPaths.some((path) => req.url.startsWith(path));

  if (shouldSilence) {
    // Return 204 (No Content) for these requests to stop the loop
    return res.status(204).end();
  }

  next();
});

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/messages', require('./routes/messages'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/conversations', require('./routes/conversations'));
  app.use('/api/users', require('./routes/users'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler - only log actual API routes, not dev tools
app.use((req, res) => {
  // Only log 404s for actual API routes
  if (req.url.startsWith('/api/')) {
    console.log(`❌ 404: ${req.method} ${req.url}`);
  }
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
