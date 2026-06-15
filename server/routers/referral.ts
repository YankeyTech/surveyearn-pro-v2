import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, transactions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

export const referralRouter = router({
  getMyReferralInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db
      .select({
        referralCode: users.referralCode,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const referrals = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        referralBonusPaid: users.referralBonusPaid,
      })
      .from(users)
      .where(eq(users.referredBy, ctx.user.id));

    const paidReferrals = referrals.filter(r => r.referralBonusPaid).length;

    const frontendUrl = process.env.FRONTEND_URL ?? "https://surveyearn-pro-v2.onrender.com";

    return {
      referralCode: user?.referralCode ?? null,
      referralLink: user?.referralCode
        ? `${frontendUrl}/signup?ref=${user.referralCode}`
        : null,
      totalReferrals: referrals.length,
      totalEarnedCents: paidReferrals * 50,
      referrals,
    };
  }),
});