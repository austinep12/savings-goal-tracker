const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const { connectDB, disconnectDB } = require('./config/db');
const Goal = require('./models/Goal');
const goalRoutes = require('./routes/goalRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve local vendor assets (Bootstrap 5 & Bootstrap Icons from npm dependencies - No CDN dependency)
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/vendor/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons')));

// Static files (Frontend UI)
app.use(express.static(path.join(__dirname, 'public')));

// Ensure database is connected for serverless environments (e.g. Vercel)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
      await seedInitialGoals();
    } catch (err) {
      console.warn('[DB Middleware Warning]:', err.message);
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);

// Health & System Info endpoint confirming Node.js & MongoDB runtime
app.get('/api/system-info', (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.status(200).json({
    success: true,
    platform: 'Node.js',
    nodeVersion: process.version,
    framework: 'Express.js v4.21',
    database: 'MongoDB',
    odm: 'Mongoose v8.9.5',
    dbConnectionState: dbStateMap[mongoose.connection.readyState] || 'Unknown',
    dbHost: mongoose.connection.host || 'Active',
    dbName: mongoose.connection.name || 'savings-tracker',
    architecture: 'MVC (Model-View-Controller)',
    academicCourse: 'Course 23CS2048 - Web Technology IA3',
    serverUptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Fallback for API 404s
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Serve frontend SPA fallback for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/**
 * Seed database with initial sample goals if collection is empty
 */
const seedInitialGoals = async () => {
  try {
    const count = await Goal.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database is empty. Seeding sample savings goals for demonstration...');

      const sampleGoals = [
        {
          title: 'Emergency Fund (6 Months)',
          targetAmount: 10000,
          currentAmount: 6500,
          category: 'Emergency',
          targetDate: new Date('2027-06-30'),
          description: 'Essential safety net covering 6 months of housing, living expenses, and emergency medical reserves.',
          isCompleted: false
        },
        {
          title: 'MacBook Pro M3 Max',
          targetAmount: 2800,
          currentAmount: 2800,
          category: 'Tech & Gadgets',
          targetDate: new Date('2026-12-15'),
          description: 'High-performance workstation upgrade for full-stack web engineering and containerized workloads.',
          isCompleted: true
        },
        {
          title: 'Japan Cherry Blossom Tour',
          targetAmount: 4500,
          currentAmount: 1800,
          category: 'Travel',
          targetDate: new Date('2027-04-15'),
          description: 'Round-trip airfare, traditional ryokan stays in Kyoto, JR bullet train passes, and culinary adventures.',
          isCompleted: false
        }
      ];

      await Goal.insertMany(sampleGoals);
      console.log('[Seed] Successfully seeded 3 realistic sample goals.');
    } else {
      console.log(`[Seed] Database already contains ${count} savings goal(s). Skipping seed.`);
    }
  } catch (seedErr) {
    console.error('[Seed Error]: Could not seed initial goals:', seedErr.message);
  }
};

/**
 * Start the Express Web Server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Seed data if empty
    await seedInitialGoals();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('========================================================');
      console.log(` 🎯 Savings Goal Tracker Server running on port ${PORT}`);
      console.log(` 🌐 Web Application URL: http://localhost:${PORT}`);
      console.log(` 🟢 Backend: Node.js ${process.version} (Express)`);
      console.log(` 🍃 Database: MongoDB (Mongoose ${mongoose.version})`);
      console.log(` 🚀 Course: 23CS2048 - Web Technology IA3`);
      console.log('========================================================');
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully closing HTTP server and DB connections...`);
      server.close(async () => {
        try {
          await disconnectDB();
          console.log('[Server] MongoDB connection closed. Process terminating.');
          process.exit(0);
        } catch (closeErr) {
          console.error('[Server Error during shutdown]:', closeErr.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('[Fatal Error] Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
