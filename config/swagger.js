const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management Platform API',
      version: '1.0.0',
      description: 'REST API documentation for the Event Management Platform',
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
