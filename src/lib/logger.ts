import winston from 'winston';

const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        // Integration to format. Tell Winston that the console logs must be colored
        winston.format.colorize({ all: true }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({ filename: 'logs/all.log', format: winston.format.json() }),
  ],
});

export default Logger;
