// ZapTI Shared — Configuration
const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  isDevelopment: env === 'development',
  isProduction: env === 'production',
  isTest: env === 'test',

  port: parseInt(process.env.PORT || '3000', 10),

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },

  bcrypt: {
    rounds: 12,
  },

  rateLimit: {
    global: {
      max: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    auth: {
      max: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    api: {
      max: 1000,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'ZapTI <noreply@zapti.com>',
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // local, s3, gcs
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    gcs: {
      bucket: process.env.GCS_BUCKET || '',
      projectId: process.env.GCS_PROJECT_ID || '',
      credentials: process.env.GCS_CREDENTIALS || '',
    },
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    appId: process.env.WHATSAPP_APP_ID || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'zapti:',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zapti',
    poolSize: 10,
  },

  logging: {
    level: env === 'production' ? 'info' : 'debug',
    prettyPrint: env !== 'production',
  },

  features: {
    enableFlows: true,
    enableAutomations: true,
    enableTickets: true,
    enableBackups: true,
    enableAudit: true,
    enableWebhooks: true,
    enableSLA: true,
  },

  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxBulkImport: 5000,
    maxFlowNodes: 500,
    maxAutomationActions: 50,
    maxWebhookRetries: 3,
  },
};

export { config };
export default config;