// ZapTI API — Configuration
import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zapti',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    rememberMeExpiry: '30d',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    sessionPrefix: 'zapti:session:',
    rateLimitPrefix: 'zapti:ratelimit:',
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'ZapTI <noreply@zapti.app>',
  },

  // WhatsApp
  whatsapp: {
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
  },

  // Storage (S3 compatible)
  storage: {
    url: process.env.STORAGE_URL || '',
    bucket: process.env.STORAGE_BUCKET || 'zapti',
    region: process.env.STORAGE_REGION || 'us-east-1',
    accessKey: process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.STORAGE_SECRET_KEY || '',
  },

  // Features flags
  features: {
    websocket: process.env.FEATURE_WEBSOCKET !== 'false',
    scheduler: process.env.FEATURE_SCHEDULER !== 'false',
    email: process.env.FEATURE_EMAIL !== 'false',
    backups: process.env.FEATURE_BACKUPS !== 'false',
  },

  // Rate limiting
  rateLimit: {
    global: { max: 1000, windowMs: 60 * 1000 }, // 1000 req/min
    auth: { max: 10, windowMs: 60 * 1000 }, // 10 req/min for auth
    webhook: { max: 100, windowMs: 60 * 1000 }, // 100 req/min for webhooks
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
};