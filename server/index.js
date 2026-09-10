import './src/config/env.js';
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import { seedDatabase } from './src/seed/seedData.js';
import { User } from './src/models/User.js';


import authRoutes from './src/routes/authRoutes.js';
import requestRoutes from './src/routes/requestRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import workflowRoutes from './src/routes/workflowRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import institutionRoutes from './src/routes/institutionRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString(), platform: 'CampusOS AI' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/institution', institutionRoutes);


// Global Error Handler (Hides raw stack traces in production)
app.use((err, req, res, next) => {
  console.error('[CampusOS Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
  });
});

// Start Server & Auto Seed if needed
const startServer = async () => {
  await connectDB();
  
  const userCount = await User.countDocuments({});
  if (userCount === 0) {
    console.log('Database empty. Running initial seedData...');
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 CampusOS AI Backend Server running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
};

startServer();
