import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  googleClientIds: (process.env.GOOGLE_CLIENT_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'FocusForge <no-reply@focusforge.app>',
  },
  isProd: process.env.NODE_ENV === 'production',
};
