/**
 * MobiFlow Server Entry Point
 * Express server with all routes mounted and CORS configured
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const rawMaterialRoutes = require('./routes/rawMaterialRoutes');
const manufacturingRoutes = require('./routes/manufacturingRoutes');
const qcRoutes = require('./routes/qcRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- API Routes ---
app.use('/auth', authRoutes);
app.use('/raw', rawMaterialRoutes);
app.use('/manufacturing', manufacturingRoutes);
app.use('/qc', qcRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/order', orderRoutes);
app.use('/dispatch', dispatchRoutes);
app.use('/', dashboardRoutes);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 MobiFlow Server running on port ${port}`);
    console.log(`📡 API Base URL: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

connectDB().then(() => {
  startServer(PORT);
});
