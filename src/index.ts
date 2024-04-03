import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import Logger from './lib/logger';
import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import openApiSpecification from './lib/documentation';
import router from './routes';

const PORT = 3002;
const app = express();

app.use(cors());
app.use(helmet());
app.use(
  morgan(
    '[:date[clf]] :method :url :status :res[content-length] - :response-time ms :remote-addr - :remote-user HTTP/:http-version "user-agent" :user-agent "referrer" :referrer',
  ),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(openApiSpecification));

app.get('/', (req, res) => {
  Logger.info('test ini log');
  res.send('hello world');
});

app.use(router);

app.listen(PORT, () => {
  console.log(`Server is on port ${PORT}`);
});

export default app;
