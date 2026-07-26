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

/* ============================================
   SECURITY
============================================ */

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://eventra-mern.vercel.app',
  'https://eventra-mern-kmjc.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, mobile apps, server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`❌ Blocked by CORS: ${origin}`);
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

app.options('*', cors());

/* ============================================
   MIDDLEWARE
============================================ */

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(compression());

app.use(cookieParser());

/* ============================================
   STRIPE WEBHOOK
============================================ */

app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

/* ============================================
   BODY PARSER
============================================ */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ============================================
   STATIC FILES
============================================ */

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

/* ============================================
   API ROUTES
============================================ */

app.use('/api', apiLimiter, routes);

/* ============================================
   SWAGGER
============================================ */

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* ============================================
   ROOT ROUTE
============================================ */

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Eventra Backend Running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    api: '/api',
    docs: '/api-docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

/* ============================================
   HEALTH CHECK
============================================ */

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    database: 'Connected',
    server: 'Running',
    timestamp: new Date().toISOString()
  });
});

/* ============================================
   404 HANDLER
============================================ */

app.use(notFound);

/* ============================================
   ERROR HANDLER
============================================ */

app.use(errorHandler);

module.exports = app;
