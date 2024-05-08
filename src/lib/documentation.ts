import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nutriwell Backend',
      description: 'API docs for Nutriwell Backend',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const openApiSpecification = swaggerJSDoc(options);

export default openApiSpecification;
