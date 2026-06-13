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
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as db from "./db";
import { users } from "../drizzle/schema";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
        const openId = `email_${nanoid()}`;
        const passwordHash = hashPassword(input.password);
        await db.upsertUser({ openId, name: input.name, email: input.email, loginMethod: "email", lastSignedIn: new Date() });
        const user = await db.getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const dbInstance = await db.getDb();
        if (dbInstance) await dbInstance.update(users).set({ passwordHash }).where(eq(users.id, user.id));
        const sessionToken = await sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
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