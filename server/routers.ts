import { creditReferralBonuses } from "./lib/referral";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { walletRouter } from "./routers/wallet";
import { surveyRouter } from "./routers/survey";
import { withdrawalRouter } from "./routers/withdrawal";
import { adminRouter } from "./routers/admin";
import { userRouter } from "./routers/user";
import { referralRouter } from "./routers/referral";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as db from "./db";
import { users } from "../drizzle/schema";
import { hashPassword, verifyPassword } from "./_core/password";
import { sendPasswordResetEmail } from "./email";
import { randomBytes } from "crypto";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,

  runMigration: publicProcedure.mutation(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const queries = [
      `ALTER TABLE users ADD COLUMN referralCode VARCHAR(16) UNIQUE`,
      `ALTER TABLE users ADD COLUMN referredBy INT DEFAULT NULL`,
      `ALTER TABLE users ADD COLUMN referralBonusPaid BOOLEAN NOT NULL DEFAULT FALSE`,
      `UPDATE users SET referralCode = UPPER(SUBSTRING(MD5(RAND()), 1, 8)) WHERE referralCode IS NULL`,
      `ALTER TABLE transactions MODIFY COLUMN type ENUM('survey_credit','withdrawal_debit','adjustment','daily_checkin','referral_bonus') NOT NULL`,
    ];

    const results: string[] = [];
    for (const q of queries) {
      try {
        await (dbInstance as any).execute(q);
        results.push(`OK: ${q.slice(0, 50)}`);
      } catch (e: any) {
        if (e.message?.includes("Duplicate column") || e.message?.includes("already exists")) {
          results.push(`SKIP: ${q.slice(0, 50)}`);
        } else {
          results.push(`ERR: ${e.message}`);
        }
      }
    }
    return { results };
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
   
register: publicProcedure
  .input(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    refCode: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const existing = await db.getUserByEmail(input.email);
    if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });

    const openId = `email_${nanoid()}`;
    const passwordHash = hashPassword(input.password);

    // Generate referral code for new user
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Look up referrer if refCode provided
    let referrerId: number | null = null;
    const dbInstance = await db.getDb();
    if (input.refCode && dbInstance) {
      const [referrer] = await dbInstance
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, input.refCode))
        .limit(1);
      if (referrer) referrerId = referrer.id;
    }

    await db.upsertUser({ openId, name: input.name, email: input.email, loginMethod: "email", lastSignedIn: new Date() });
    const user = await db.getUserByEmail(input.email);
    if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (dbInstance) {
      await dbInstance.update(users)
        .set({
          passwordHash,
          referralCode: newReferralCode,
          referredBy: referrerId ?? undefined,
        })
        .where(eq(users.id, user.id));
    }

    // Credit referral bonuses
    if (referrerId) {
      await creditReferralBonuses(referrerId, user.id);
    }

    const sessionToken = await sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    return { success: true };
  }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) return { success: true };
        const token = randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 1000 * 60 * 60);
        const dbInstance = await db.getDb();
        if (dbInstance) {
          await dbInstance.update(users)
            .set({ passwordResetToken: token, passwordResetExpiry: expiry })
            .where(eq(users.id, user.id));
        }
        await sendPasswordResetEmail(user.email ?? "", user.name ?? "there", token);
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [user] = await dbInstance.select().from(users)
          .where(eq(users.passwordResetToken, input.token))
          .limit(1);
        if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Reset link is invalid or has expired" });
        }
        const passwordHash = hashPassword(input.password);
        await dbInstance.update(users)
          .set({ passwordHash, passwordResetToken: null, passwordResetExpiry: null })
          .where(eq(users.id, user.id));
        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        const valid = verifyPassword(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),
  }),

  wallet: walletRouter,
  survey: surveyRouter,
  withdrawal: withdrawalRouter,
  admin: adminRouter,
  user: userRouter,
  referral: referralRouter,
});

export type AppRouter = typeof appRouter;