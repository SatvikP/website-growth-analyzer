const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many analysis requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api/', limiter);

// API Routes
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/admin', require('./routes/admin')); // NEW: Admin routes for lead management

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check endpoint called at:', new Date().toISOString());
  console.log('🔍 Request headers:', req.headers);
  
  const healthData = { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: process.uptime(),
    database: 'PostgreSQL enabled' // NEW: Indicate database is available
  };
  
  console.log('✅ Sending health check response:', healthData);
  res.json(healthData);
});

// Serve static files from React build (for production)
const clientBuildPath = path.join(__dirname, '../client/dist');
console.log('🔍 Looking for client build at:', clientBuildPath);

// Check if build directory exists
const fs = require('fs');
if (fs.existsSync(clientBuildPath)) {
  console.log('✅ Client build directory found');
  app.use(express.static(clientBuildPath));
} else {
  console.log('❌ Client build directory NOT found at:', clientBuildPath);
  // Fallback: serve a simple message if no build files
  app.get('/', (req, res) => {
    res.json({
      message: 'Website Growth Analyzer API is running',
      error: 'Frontend build files not found',
      buildPath: clientBuildPath,
      timestamp: new Date().toISOString(),
      features: ['AI Analysis', 'Lead Tracking', 'Admin Dashboard'] // NEW: List features
    });
  });
}

// Catch-all handler: send back React's index.html file for any non-api routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  console.log('🔍 Catch-all route hit for:', req.path);
  console.log('🔍 Looking for index.html at:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Serving index.html');
    res.sendFile(indexPath);
  } else {
    console.log('❌ index.html not found');
    res.status(404).json({
      error: 'Frontend not built',
      message: 'React build files are missing',
      path: req.path,
      indexPath: indexPath
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🎯 Admin dashboard: http://0.0.0.0:${PORT}/api/admin/leads?token=YOUR_TOKEN`); // NEW: Admin access info
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify environment variables in development
  if (process.env.NODE_ENV === 'development') {
    const requiredEnvVars = ['FIRECRAWL_API_KEY', 'ANTHROPIC_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // NEW: Database connection info
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is configured');
    } else {
      console.warn('⚠️  DATABASE_URL not found - lead tracking disabled');
    }
    
    if (process.env.ADMIN_TOKEN) {
      console.log('✅ ADMIN_TOKEN is configured');
    } else {
      console.warn('⚠️  ADMIN_TOKEN not set - using default (change in production!)');
    }
  }
});