import fs from 'fs';
import path from 'path';

const COOKIE_SECRET = process.env.COOKIE_SECRET;
const API_URL = process.env.API_URL ?? 'http://localhost:3002';
const BITESHIP_URL = process.env.BITESHIP_URL;
const XENDIT_URL = process.env.XENDIT_URL;
const XENDIT_API_KEY = process.env.SECRET_XENDIT ?? '';
const BITESHIP_API_KEY = process.env.SECRET_BITESHIP ?? '';
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
const CONFIG_PATH = process.env.CONFIG_PATH ?? '/root';
const PRIVATE_KEY = fs.readFileSync(path.join(CONFIG_PATH, '.ssh/rs256_nutriwell'), 'utf8');
const PUBLIC_KEY = fs.readFileSync(path.join(CONFIG_PATH, '.ssh/rs256_nutriwell.pub'), 'utf8');
const XENDIT_HEADER = { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(XENDIT_API_KEY + ':')}` };
const BITESHIP_HEADER = [
  ['Content-Type', 'application/json'],
  ['authorization', BITESHIP_API_KEY],
];
const MORGAN_FORMAT =
  '[:date[clf]] :method :url :status :res[content-length] - :response-time ms :remote-addr - :remote-user HTTP/:http-version "user-agent" :user-agent "referrer" :referrer';
const DB = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_TIMEZONE: process.env.DB_TIMEZONE,
  DB_DATABASE: process.env.DB_DATABASE,
};
const EMAIL_SERVICE = {
  API_URL: 'https://api.emailjs.com/api/v1.0/email/send',
  SERVICE_ID: process.env.ENVIRONMENT === 'dev' ? 'service_tr7a0ze' : 'service_0acl3dk',
  TEMPLATE_RESET_PASSWORD_ID: process.env.ENVIRONMENT === 'dev' ? 'template_p6qt6gx' : 'template_nxmdcpt',
  TEMPLATE_VERIFICATION_ID: process.env.ENVIRONMENT === 'dev' ? 'template_u1dvl5t' : 'template_0n5jywb',
  USER_ID: process.env.ENVIRONMENT === 'dev' ? 'ozxbQV2BQmrxvbrsG' : 'grTOHs9KEIi9zkhYb',
  ACCESS_TOKEN: process.env.MAILJS_TOKEN,
};

const MAILJET_SERVICE = {
  MJ_APIKEY_PUBLIC: process.env.MAILJET_API_KEY ?? '',
  MJ_APIKEY_PRIVATE: process.env.MAILJET_SECRET_KEY ?? '',
};

const MAX_DOWNLINE_SIZE = Number(process.env.MAX_DOWNLINE_SIZE) ?? 10;

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
  EMAIL_SERVICE,
  CONFIG_PATH,
  MAILJET_SERVICE,
  MAX_DOWNLINE_SIZE,
};
