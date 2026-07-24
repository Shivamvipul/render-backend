const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { stripeWebhook } = require('./controllers/paymentController');

const app = express();

// ==============================
// Security Middleware
// ==============================
app.use(helmet());

// Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://eventra-mern.vercel.app',
  'https://eventra-mern-kmjc.vercel.app'
];

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization'
    ]
  })
);

// Handle preflight requests
app.options('*', cors());

// ==============================
// Core Middleware
// ==============================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(cookieParser());

// ==============================
// Stripe Webhook
// ==============================
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==============================
// API Routes
// ==============================
app.use('/api', apiLimiter, routes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Eventra Backend Running',
    timestamp: new Date().toISOString()
  });
});

// ==============================
// Error Handling
// ==============================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
