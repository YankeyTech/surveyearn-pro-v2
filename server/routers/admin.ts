import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { withdrawals, wallets, transactions, users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
  return next({ ctx });
});

export const adminRouter = router({

  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [allUsers, allWallets, allWithdrawals, allTransactions] = await Promise.all([
      db.select({ id: users.id }).from(users),
      db.select({ balanceCents: wallets.balanceCents, totalEarnedCents: wallets.totalEarnedCents, totalWithdrawnCents: wallets.totalWithdrawnCents }).from(wallets),
      db.select({ status: withdrawals.status, amountCents: withdrawals.amountCents }).from(withdrawals),
      db.select({ type: transactions.type }).from(transactions),
    ]);

    const totalEarnedCents = allWallets.reduce((s, w) => s + w.totalEarnedCents, 0);
    const totalWithdrawnCents = allWallets.reduce((s, w) => s + w.totalWithdrawnCents, 0);
    const pendingWithdrawalsCount = allWithdrawals.filter(w => w.status === "pending").length;
    const totalResponses = allTransactions.filter(t => t.type === "survey_credit").length;

    return {
      totalUsers: allUsers.length,
      totalSurveys: 0,
      totalResponses,
      pendingWithdrawals: pendingWithdrawalsCount,
      totalEarnedCents,
      totalWithdrawnCents,
    };
  }),

  getPendingWithdrawals: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db
        .select({
          id: withdrawals.id,
          amountCents: withdrawals.amountCents,
          method: withdrawals.method,
          accountDetails: withdrawals.accountDetails,
          status: withdrawals.status,
          requestedAt: withdrawals.requestedAt,
          userId: withdrawals.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(withdrawals)
        .leftJoin(users, eq(withdrawals.userId, users.id))
        .where(eq(withdrawals.status, "pending"))
        .orderBy(desc(withdrawals.requestedAt))
        .limit(input?.limit ?? 50);

      return rows;
    }),

  pendingWithdrawals: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rows = await db
      .select({
        withdrawal: withdrawals,
        user: { id: users.id, name: users.name, email: users.email },
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.requestedAt));

    return rows;
  }),

  allWithdrawals: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return db
        .select({
          withdrawal: withdrawals,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(withdrawals)
        .leftJoin(users, eq(withdrawals.userId, users.id))
        .orderBy(desc(withdrawals.requestedAt))
        .limit(input?.limit ?? 50);
    }),

  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isSuspended: users.isSuspended,
          isBanned: users.isBanned,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  suspendUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ isSuspended: true }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ isBanned: true, isSuspended: true }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  approveWithdrawal: adminProcedure
    .input(z.object({ withdrawalId: z.number(), note: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(withdrawals).where(eq(withdrawals.id, input.withdrawalId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      if (rows[0].status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending withdrawals can be approved" });

      await db.update(withdrawals).set({ status: "approved", adminNote: input.note ?? null, processedAt: new Date() }).where(eq(withdrawals.id, input.withdrawalId));

      const walletRows = await db.select().from(wallets).where(eq(wallets.userId, rows[0].userId)).limit(1);
      if (walletRows.length) {
        await db.update(wallets).set({ totalWithdrawnCents: walletRows[0].totalWithdrawnCents + rows[0].amountCents }).where(eq(wallets.userId, rows[0].userId));
      }

      return { success: true };
    }),

  rejectWithdrawal: adminProcedure
    .input(z.object({ withdrawalId: z.number(), note: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(withdrawals).where(eq(withdrawals.id, input.withdrawalId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      if (rows[0].status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending withdrawals can be rejected" });

      await db.update(withdrawals).set({ status: "rejected", adminNote: input.note ?? null, processedAt: new Date() }).where(eq(withdrawals.id, input.withdrawalId));

      const walletRows = await db.select().from(wallets).where(eq(wallets.userId, rows[0].userId)).limit(1);
      if (walletRows.length) {
        await db.update(wallets).set({ balanceCents: walletRows[0].balanceCents + rows[0].amountCents }).where(eq(wallets.userId, rows[0].userId));
      }

      await db.insert(transactions).values({
        userId: rows[0].userId,
        type: "adjustment",
        amountCents: rows[0].amountCents,
        status: "completed",
        note: `Withdrawal rejected: ${input.note ?? "no reason given"}`,
      });

      return { success: true };
    }),

  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [allUsers, allWallets, allWithdrawals] = await Promise.all([
      db.select({ id: users.id }).from(users),
      db.select({ balanceCents: wallets.balanceCents, totalEarnedCents: wallets.totalEarnedCents, totalWithdrawnCents: wallets.totalWithdrawnCents }).from(wallets),
      db.select({ status: withdrawals.status, amountCents: withdrawals.amountCents }).from(withdrawals),
    ]);

    return {
      totalUsers: allUsers.length,
      totalBalanceCents: allWallets.reduce((s, w) => s + w.balanceCents, 0),
      totalEarnedCents: allWallets.reduce((s, w) => s + w.totalEarnedCents, 0),
      totalWithdrawnCents: allWallets.reduce((s, w) => s + w.totalWithdrawnCents, 0),
      pendingWithdrawalsCents: allWithdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.amountCents, 0),
    };
  }),
});