// server/src/config/config.js

require('dotenv').config();

// This function throws immediately at startup if a required variable is missing.
// Better to crash on boot than to fail silently in production at 3am.
const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5002,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    isDev: process.env.NODE_ENV !== 'production',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'ticketing_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
  },

  jwt: {
    secret: required('JWT_SECRET'), // ← crashes if not set. intentional.
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || 'support@ticketing.dev',
  },
};

module.exports = config;
