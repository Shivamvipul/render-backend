require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');

const PORT = process.env.PORT || 5000;

// Allowed Frontend Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://eventra-mern.vercel.app',
  'https://eventra-mern-kmjc.vercel.app'
];

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests without origin (Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('Socket.IO CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

initSocket(io);

const start = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );

      console.log(
        `📚 Swagger Docs: http://localhost:${PORT}/api-docs`
      );
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
