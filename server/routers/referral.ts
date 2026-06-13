import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, transactions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

export const referralRouter = router({
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const frontendUrl = process.env.FRONTEND_URL ?? "https://surveyearn-pro-v2.onrender.com";
    const referralCode = `ref_${ctx.user.id}`;
    const referralUrl = `${frontendUrl}?ref=${referralCode}`;

    return {
      referralCode,
      referralUrl,
    };
  }),

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Count users who signed up with this referral code
    const referralCode = `ref_${ctx.user.id}`;
    const referredUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.openId, referralCode));

    // Sum referral commission transactions
    const commissionTxns = await db
      .select({ amountCents: transactions.amountCents })
      .from(transactions)
      .where(eq(transactions.userId, ctx.user.id));

    const referralEarnings = commissionTxns
      .filter(t => t.amountCents > 0)
      .reduce((s, t) => s + t.amountCents, 0);

    return {
      totalClicks: 0, // Would need click tracking table to implement
      totalSignups: referredUsers.length,
      totalEarnings: (referralEarnings / 100).toFixed(2),
    };
  }),
});