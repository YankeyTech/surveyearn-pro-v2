import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, wallets, transactions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { hashPassword, verifyPassword } from "../_core/password";

export const userRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(users)
        .set({ name: input.name, ...(input.email ? { email: input.email } : {}) })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  uploadProfilePicture: protectedProcedure
    .input(z.object({ file: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const url = `data:image/jpeg;base64,${input.file}`;
      await db.update(users)
        .set({ profilePictureUrl: url })
        .where(eq(users.id, ctx.user.id));
      return { url };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const user = rows[0];
      if (!user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set for this account" });
      const valid = verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      const newHash = hashPassword(input.newPassword);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  getCheckinStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const user = rows[0];
      const REWARD_CENTS = 10;
      const now = new Date();
      let canCheckin = true;
      let nextCheckinAt: Date | null = null;
      if (user.lastCheckinAt) {
        const last = new Date(user.lastCheckinAt);
        const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
        if (now < next) {
          canCheckin = false;
          nextCheckinAt = next;
        }
      }
      return { canCheckin, nextCheckinAt, lastCheckinAt: user.lastCheckinAt, rewardCents: REWARD_CENTS };
    }),

  dailyCheckin: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const user = rows[0];

      const now = new Date();
      if (user.lastCheckinAt) {
        const last = new Date(user.lastCheckinAt);
        const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) {
          const hoursLeft = Math.ceil(24 - hoursSince);
          throw new TRPCError({ code: "BAD_REQUEST", message: `Already checked in. Try again in ${hoursLeft}h.` });
        }
      }

      const REWARD_CENTS = 10;

      await db.update(users).set({ lastCheckinAt: now }).where(eq(users.id, ctx.user.id));

      await db.update(wallets)
        .set({
          balanceCents: sql`${wallets.balanceCents} + ${REWARD_CENTS}`,
          totalEarnedCents: sql`${wallets.totalEarnedCents} + ${REWARD_CENTS}`,
        })
        .where(eq(wallets.userId, ctx.user.id));

      await db.insert(transactions).values({
        userId: ctx.user.id,
        type: "daily_checkin",
        amountCents: REWARD_CENTS,
        status: "completed",
        note: "Daily check-in bonus",
      });

      return { success: true, rewardCents: REWARD_CENTS };
    }),
});