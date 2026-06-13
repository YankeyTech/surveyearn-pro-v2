import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, wallets, transactions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { hashPassword, verifyPassword } from "../_core/password";

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

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
      const BASE_REWARD_CENTS = 10;
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
      return {
        canCheckin,
        nextCheckinAt,
        lastCheckinAt: user.lastCheckinAt,
        rewardCents: BASE_REWARD_CENTS,
        streakCount: user.streakCount,
      };
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

      const BASE_REWARD_CENTS = 10;
      const STREAK_BONUS_CENTS = 50;
      const STREAK_BONUS_INTERVAL = 7;

      // Determine streak
      const today = dateStr(now);
      const yesterday = dateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      let newStreak = 1;
      if (user.streakLastDate === yesterday) {
        newStreak = (user.streakCount || 0) + 1;
      } else {
        newStreak = 1;
      }

      let totalReward = BASE_REWARD_CENTS;
      let bonusAwarded = false;
      if (newStreak % STREAK_BONUS_INTERVAL === 0) {
        totalReward += STREAK_BONUS_CENTS;
        bonusAwarded = true;
      }

      await db.update(users)
        .set({ lastCheckinAt: now, streakCount: newStreak, streakLastDate: today })
        .where(eq(users.id, ctx.user.id));

      await db.update(wallets)
        .set({
          balanceCents: sql`${wallets.balanceCents} + ${totalReward}`,
          totalEarnedCents: sql`${wallets.totalEarnedCents} + ${totalReward}`,
        })
        .where(eq(wallets.userId, ctx.user.id));

      await db.insert(transactions).values({
        userId: ctx.user.id,
        type: "daily_checkin",
        amountCents: totalReward,
        status: "completed",
        note: bonusAwarded
          ? `Daily check-in + ${newStreak}-day streak bonus`
          : `Daily check-in (streak: ${newStreak})`,
      });

      return { success: true, rewardCents: totalReward, streakCount: newStreak, bonusAwarded };
    }),
});