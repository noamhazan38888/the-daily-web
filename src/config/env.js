import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'SESSION_SECRET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGODB_URI,
  sessionSecret: process.env.SESSION_SECRET,
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 7)
};
