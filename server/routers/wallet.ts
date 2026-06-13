import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { transactions, wallets } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

export const walletRouter = router({
  // Get current user's wallet summary
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const walletRows = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, ctx.user.id))
      .limit(1);

    if (!walletRows.length) {
      return {
        balanceCents: 0,
        totalEarnedCents: 0,
        totalWithdrawnCents: 0,
      };
    }
    return walletRows[0];
  }),

  // Get transaction history
  history: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const rows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .limit(input?.limit ?? 20)
        .orderBy(transactions.createdAt);

      return rows.reverse(); // newest first
    }),
});
