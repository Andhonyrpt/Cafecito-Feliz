import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cafecito API',
      version: '1.0.0',
      description: 'API del sistema POS Cafecito Feliz',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
    ],
  },
  // Rutas donde buscar JSDoc
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
