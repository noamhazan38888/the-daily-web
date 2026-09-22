import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from './env.js';

export function createSessionMiddleware() {
  return session({
    name: 'the-daily.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.mongoUri,
      ttl: env.sessionTtlDays * 24 * 60 * 60
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: env.sessionTtlDays * 24 * 60 * 60 * 1000
    }
  });
}
