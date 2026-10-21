import nodemailer from 'nodemailer';
import { config } from '../config';

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!config.smtp.host) {
    // Development fallback: print instead of sending.
    console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });

  await transport.sendMail({ from: config.smtp.from, to, subject, text });
}
