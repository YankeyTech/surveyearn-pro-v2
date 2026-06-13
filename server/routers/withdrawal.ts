import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { wallets, withdrawals, transactions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

const MIN_WITHDRAWAL_CENTS = 500; // $5.00 minimum

export const withdrawalRouter = router({
  // Submit a withdrawal request
  request: protectedProcedure
    .input(
      z.object({
        amountCents: z.number().int().min(MIN_WITHDRAWAL_CENTS),
        method: z.enum(["mobile_money", "bank_transfer", "paypal"]),
        accountDetails: z.string().min(5).max(500), // JSON string or plain text
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Check balance
      const walletRows = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);

      const balance = walletRows[0]?.balanceCents ?? 0;
      if (balance < input.amountCents) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: $${(balance / 100).toFixed(2)}`,
        });
      }

      // Deduct balance immediately (hold)
      if (walletRows.length) {
        await db
          .update(wallets)
          .set({ balanceCents: balance - input.amountCents })
          .where(eq(wallets.userId, ctx.user.id));
      }

      // Create withdrawal record
      const [result] = await db.insert(withdrawals).values({
        userId: ctx.user.id,
        amountCents: input.amountCents,
        method: input.method,
        accountDetails: input.accountDetails,
        status: "pending",
      });

      // Record the debit transaction
      await db.insert(transactions).values({
        userId: ctx.user.id,
        type: "withdrawal_debit",
        amountCents: -input.amountCents,
        status: "pending",
        note: `Withdrawal request via ${input.method}`,
      });

      return { success: true, withdrawalId: (result as any).insertId };
    }),

  // List user's own withdrawals
  myList: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, ctx.user.id))
      .orderBy(desc(withdrawals.requestedAt));
  }),
});
