import fs from 'fs';
import path from 'path';

const COOKIE_SECRET = process.env.COOKIE_SECRET;
const API_URL = process.env.API_URL ?? 'http://localhost:3002';
const BITESHIP_URL = process.env.BITESHIP_URL;
const XENDIT_URL = process.env.XENDIT_URL;
const XENDIT_API_KEY = process.env.SECRET_XENDIT ?? '';
const BITESHIP_API_KEY = process.env.SECRET_BITESHIP ?? '';
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

const XENDIT_HEADER = { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(XENDIT_API_KEY + ':')}` };

const BITESHIP_HEADER = [
  ['Content-Type', 'application/json'],
  ['authorization', BITESHIP_API_KEY],
];

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
export {
  COOKIE_SECRET,
  MORGAN_FORMAT,
  DB,
  PRIVATE_KEY,
  PUBLIC_KEY,
  API_URL,
  BITESHIP_URL,
  BITESHIP_API_KEY,
  BITESHIP_HEADER,
  XENDIT_URL,
  XENDIT_API_KEY,
  XENDIT_HEADER,
  XENDIT_WEBHOOK_TOKEN,
};
