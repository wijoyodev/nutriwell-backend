import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import 'dotenv/config';
import Logger from './lib/logger';
import openApiSpecification from './lib/documentation';
import router from './routes';
import * as settings from './settings';
import { clientInfo, errorMiddleware } from './middlewares';

const PORT = 3002;
const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan(settings.MORGAN_FORMAT));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(settings.COOKIE_SECRET));
app.use(express.static(join(__dirname, '../uploads')));
app.use(clientInfo as express.RequestHandler);
// swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(openApiSpecification));

app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/logs', (req, res) => {
  const { from, limit = 100, offset = 0 } = req.query;
  Logger.query(
    {
      from: typeof from === 'string' ? new Date(from) : new Date(),
      order: 'desc',
      start: Number(offset),
      limit: Number(limit),
      fields: ['message', 'level', 'timestamp'],
    },
    (err, result) => {
      if (err) {
        res.status(400).send({
          error: 'Error retrieving logs',
        });
      } else {
        res.send(result);
      }
    },
  );
});

app.get('/.well-known/assetlinks.json', function (req, res) {
  res.sendFile(join(__dirname, '../assetlinks.json'));
});

app.get('/.well-known/apple-app-site-association', function (req, res) {
  res.sendFile(join(__dirname, '../apple-app-site-association'));
});

app.use(router);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is on port ${PORT}`);
});

export default app;
