const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./src/config/database');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');

// Import models to ensure they are registered with sequelize
require('./src/models');

// Basic route
app.get('/', (req, res) => {
  res.json({
    name: 'Harvest Circle API',
    version: '1.0.0',
    status: 'running',
    message: 'Welcome to Harvest Circle API!',
    endpoints: {
      auth: '/api/auth',
      farmers: '/api/farmers',
      buyers: '/api/buyers',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments'
    }
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Welcome message endpoint
app.get('/welcome', (req, res) => {
  res.json({
    message: 'Welcome to Harvest Circle API!',
    description: 'A Digital Agricultural Marketplace System',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    database: 'connected',
    uptime: process.uptime()
  });
});

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    // Sync database (in development only)
    if (process.env.NODE_ENV === 'development') {
      return sequelize.sync({ alter: true });
    }
  })
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

module.exports = app;