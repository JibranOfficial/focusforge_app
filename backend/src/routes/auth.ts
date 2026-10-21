import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import { config } from '../config';
import { badRequest, conflict, unauthorized } from '../errors';
import { requireAuth, signToken, uid } from '../middleware/auth';
import { publicUser } from '../utils/serialize';
import { sendMail } from '../utils/mailer';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email,
  password,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

const googleClient = new OAuth2Client();

router.post('/register', authLimiter, async (req, res) => {
  const body = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      settings: { create: {} },
    },
  });

  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post('/login', authLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !user.passwordHash) throw unauthorized('Incorrect email or password');

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw unauthorized('Incorrect email or password');

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

const googleSchema = z.object({ idToken: z.string().min(10) });

router.post('/google', authLimiter, async (req, res) => {
  const { idToken } = googleSchema.parse(req.body);

  if (config.googleClientIds.length === 0) {
    throw badRequest('Google sign-in is not configured on the server');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.googleClientIds });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized('Google sign-in failed');
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw unauthorized('Google account email is not verified');
  }

  const googleEmail = payload.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: googleEmail } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: payload.sub, avatarUrl: byEmail.avatarUrl ?? payload.picture ?? null },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: payload.name ?? googleEmail.split('@')[0],
          email: googleEmail,
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null,
          settings: { create: {} },
        },
      });
    }
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });
  res.json({ user: publicUser(user) });
});

const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(2000).nullable().optional(),
});

router.patch('/me', requireAuth, async (req, res) => {
  const body = updateMeSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: uid(req) }, data: body });
  res.json({ user: publicUser(user) });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: password,
});

router.post('/change-password', requireAuth, async (req, res) => {
  const body = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });

  if (user.passwordHash) {
    if (!body.currentPassword) throw badRequest('Enter your current password');
    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) throw unauthorized('Current password is incorrect');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(body.newPassword, 12) },
  });
  res.json({ ok: true });
});

const deleteSchema = z.object({ password: z.string().optional() });

router.delete('/me', requireAuth, async (req, res) => {
  const body = deleteSchema.parse(req.body ?? {});
  const user = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });

  if (user.passwordHash) {
    if (!body.password) throw badRequest('Enter your password to delete your account');
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw unauthorized('Password is incorrect');
  }

  await prisma.user.delete({ where: { id: user.id } });
  res.json({ ok: true });
});

// ---- Password reset (6-digit code) ----

const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email: addr } = z.object({ email }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: addr } });
  if (user) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await sendMail(
      user.email,
      'Your FocusForge password reset code',
      `Your FocusForge reset code is ${code}. It expires in 15 minutes.\nIf you did not request this, you can ignore this email.`,
    );
  }

  // Always respond the same way so emails can't be enumerated.
  res.json({ ok: true });
});

router.post('/reset-password', authLimiter, async (req, res) => {
  const body = z.object({ email, code: z.string().length(6), password }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) throw badRequest('Invalid or expired code');

  const record = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      codeHash: hashCode(body.code),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw badRequest('Invalid or expired code');

  await prisma.$transaction([
    prisma.passwordResetCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(body.password, 12) },
    }),
  ]);

  res.json({ ok: true });
});

export default router;
