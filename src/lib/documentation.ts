import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nutriwell Backend',
      description: 'API docs for Nutriwell Backend',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const openApiSpecification = swaggerJSDoc(options);

export default openApiSpecification;
