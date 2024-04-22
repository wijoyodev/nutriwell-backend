import fs from 'fs';
import path from 'path';

const COOKIE_SECRET = process.env.COOKIE_SECRET;
const MORGAN_FORMAT =
  '[:date[clf]] :method :url :status :res[content-length] - :response-time ms :remote-addr - :remote-user HTTP/:http-version "user-agent" :user-agent "referrer" :referrer';
const DB = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_TIMEZONE: process.env.DB_TIMEZONE,
  DB_DATABASE: process.env.DB_DATABASE,
};
const PRIVATE_KEY = fs.readFileSync(path.join(__dirname.split('Documents')[0], '.ssh/rs256_nutriwell'), 'utf8');
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname.split('Documents')[0], '.ssh/rs256_nutriwell.pub'), 'utf8');
export { COOKIE_SECRET, MORGAN_FORMAT, DB, PRIVATE_KEY, PUBLIC_KEY };
