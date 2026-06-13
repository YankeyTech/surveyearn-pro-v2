const fs = require("fs");
const content = `import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";
import { users, wallets, transactions, withdrawals } from "../../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "onboarding@resend.dev";

async function sendEmail(to, subject, html) {
  await resend.emails.send({ from: FROM, to, subject, html });
}

export const adminRouter = router({

  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    const [totalUsers] = await db.select({ count: sql\`count(*)\` }).from(users);
    const [activeUsers] = await db.select({ count: sql\`count(*)\` }).from(users).where(eq(users.isSuspended, false));
    const [suspendedUsers] = await db.select({ count: sql\`count(*)\` }).from(users).where(eq(users.isSuspended, true));
    const [bannedUsers] = await db.select({ count: sql\`count(*)\` }).from(users).where(eq(users.isBanned, true));
    const [pendingWd] = await db.select({ count: sql\`count(*)\` }).from(withdrawals).where(eq(withdrawals.status, "pending"));
    const [totalTx] = await db.select({ count: sql\`count(*)\` }).from(transactions);
    const [totalEarned] = await db.select({ total: sql\`sum(balanceCents)\` }).from(wallets);
    const [totalWithdrawn] = await db.select({ total: sql\`sum(totalWithdrawnCents)\` }).from(wallets);
    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      suspendedUsers: suspendedUsers.count,
      bannedUsers: bannedUsers.count,
      pendingWithdrawals: pendingWd.count,
      totalTransactions: totalTx.count,
      totalEarnedCents: totalEarned.total ?? 0,
      totalWithdrawnCents: totalWithdrawn.total ?? 0,
    };
  }),

  getActivityStats: adminProcedure.query(async () => {
    const db = await getDb();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const start = new Date(dateStr + "T00:00:00Z");
      const end = new Date(dateStr + "T23:59:59Z");
      const [row] = await db.select({ count: sql\`count(*)\` })
        .from(transactions)
        .where(and(gte(transactions.createdAt, start), sql\`\${transactions.createdAt} <= \${end}\`));
      days.push({ date: dateStr, count: row.count });
    }
    return days;
  }),

  getUsers: adminProcedure.input(z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
    search: z.string().optional(),
    filter: z.enum(["all", "suspended", "banned"]).default("all"),
  })).query(async ({ input }) => {
    const db = await getDb();
    const offset = (input.page - 1) * input.limit;
    let rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
    if (input.search) {
      const s = input.search.toLowerCase();
      rows = rows.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    if (input.filter === "suspended") rows = rows.filter(u => u.isSuspended);
    if (input.filter === "banned") rows = rows.filter(u => u.isBanned);
    return { users: rows.slice(offset, offset + input.limit), total: rows.length };
  }),

  getUserDetail: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, input.userId));
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, input.userId));
    const txList = await db.select().from(transactions).where(eq(transactions.userId, input.userId)).orderBy(desc(transactions.createdAt)).limit(50);
    const wdList = await db.select().from(withdrawals).where(eq(withdrawals.userId, input.userId)).orderBy(desc(withdrawals.requestedAt)).limit(20);
    return { user, wallet: wallet ?? null, transactions: txList, withdrawals: wdList };
  }),

  suspendUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(users).set({ isSuspended: true }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  unsuspendUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(users).set({ isSuspended: false }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  banUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(users).set({ isBanned: true, isSuspended: true }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  unbanUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(users).set({ isBanned: false, isSuspended: false }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  deleteUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(transactions).where(eq(transactions.userId, input.userId));
    await db.delete(withdrawals).where(eq(withdrawals.userId, input.userId));
    await db.delete(wallets).where(eq(wallets.userId, input.userId));
    await db.delete(users).where(eq(users.id, input.userId));
    return { success: true };
  }),

  adjustBalance: adminProcedure.input(z.object({
    userId: z.number(),
    amountCents: z.number(),
    note: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, input.userId));
    if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });
    const newBalance = wallet.balanceCents + input.amountCents;
    if (newBalance < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Balance would go negative" });
    await db.update(wallets).set({ balanceCents: newBalance }).where(eq(wallets.userId, input.userId));
    await db.insert(transactions).values({
      userId: input.userId,
      type: "adjustment",
      amountCents: input.amountCents,
      status: "completed",
      note: input.note ?? "Admin balance adjustment",
    });
    return { success: true, newBalance };
  }),

  getAllWithdrawals: adminProcedure.input(z.object({
    status: z.enum(["all", "pending", "approved", "rejected", "paid"]).default("all"),
    page: z.number().default(1),
    limit: z.number().default(20),
  })).query(async ({ input }) => {
    const db = await getDb();
    const offset = (input.page - 1) * input.limit;
    let rows = await db.select().from(withdrawals).orderBy(desc(withdrawals.requestedAt)).limit(500);
    if (input.status !== "all") rows = rows.filter(w => w.status === input.status);
    return { withdrawals: rows.slice(offset, offset + input.limit), total: rows.length };
  }),

  approveWithdrawal: adminProcedure.input(z.object({
    withdrawalId: z.number(),
    note: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    const [wd] = await db.select().from(withdrawals).where(eq(withdrawals.id, input.withdrawalId));
    if (!wd) throw new TRPCError({ code: "NOT_FOUND", message: "Withdrawal not found" });
    await db.update(withdrawals).set({ status: "approved", adminNote: input.note ?? null, processedAt: new Date() }).where(eq(withdrawals.id, input.withdrawalId));
    const [user] = await db.select().from(users).where(eq(users.id, wd.userId));
    if (user?.email) {
      await sendEmail(user.email, "Your withdrawal has been approved",
        "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'><h2 style='color:#f97316'>SurveyEarn Pro</h2><p>Hi " + (user.name ?? "there") + ",</p><p>Your withdrawal of <strong>$" + (wd.amountCents / 100).toFixed(2) + "</strong> has been <strong>approved</strong> and is being processed.</p>" + (input.note ? "<p>Note: " + input.note + "</p>" : "") + "<p style='color:#999;font-size:12px'>- The SurveyEarn Team</p></div>"
      );
    }
    return { success: true };
  }),

  rejectWithdrawal: adminProcedure.input(z.object({
    withdrawalId: z.number(),
    note: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    const [wd] = await db.select().from(withdrawals).where(eq(withdrawals.id, input.withdrawalId));
    if (!wd) throw new TRPCError({ code: "NOT_FOUND", message: "Withdrawal not found" });
    await db.update(wallets).set({ balanceCents: sql\`balanceCents + \${wd.amountCents}\` }).where(eq(wallets.userId, wd.userId));
    await db.insert(transactions).values({ userId: wd.userId, type: "adjustment", amountCents: wd.amountCents, status: "completed", note: "Withdrawal rejected - refund" });
    await db.update(withdrawals).set({ status: "rejected", adminNote: input.note ?? null, processedAt: new Date() }).where(eq(withdrawals.id, input.withdrawalId));
    const [user] = await db.select().from(users).where(eq(users.id, wd.userId));
    if (user?.email) {
      await sendEmail(user.email, "Your withdrawal was not approved",
        "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'><h2 style='color:#f97316'>SurveyEarn Pro</h2><p>Hi " + (user.name ?? "there") + ",</p><p>Your withdrawal of <strong>$" + (wd.amountCents / 100).toFixed(2) + "</strong> was <strong>rejected</strong>. The amount has been refunded to your balance.</p>" + (input.note ? "<p>Reason: " + input.note + "</p>" : "") + "<p style='color:#999;font-size:12px'>- The SurveyEarn Team</p></div>"
      );
    }
    return { success: true };
  }),

  markWithdrawalPaid: adminProcedure.input(z.object({ withdrawalId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(withdrawals).set({ status: "paid", processedAt: new Date() }).where(eq(withdrawals.id, input.withdrawalId));
    return { success: true };
  }),

  getAllTransactions: adminProcedure.input(z.object({
    type: z.enum(["all", "survey_credit", "withdrawal_debit", "adjustment", "daily_checkin"]).default("all"),
    page: z.number().default(1),
    limit: z.number().default(20),
  })).query(async ({ input }) => {
    const db = await getDb();
    const offset = (input.page - 1) * input.limit;
    let rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(500);
    if (input.type !== "all") rows = rows.filter(t => t.type === input.type);
    return { transactions: rows.slice(offset, offset + input.limit), total: rows.length };
  }),

  sendMailToUser: adminProcedure.input(z.object({
    userId: z.number(),
    subject: z.string(),
    body: z.string(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, input.userId));
    if (!user?.email) throw new TRPCError({ code: "NOT_FOUND", message: "User has no email" });
    await sendEmail(user.email, input.subject,
      "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'><h2 style='color:#f97316'>SurveyEarn Pro</h2><div>" + input.body.replace(/\\n/g, "<br>") + "</div><p style='color:#999;font-size:12px;margin-top:24px'>- The SurveyEarn Team</p></div>"
    );
    return { success: true };
  }),

  sendMailToAll: adminProcedure.input(z.object({
    subject: z.string(),
    body: z.string(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    const allUsers = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.isBanned, false));
    const emails = allUsers.filter(u => u.email);
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      await Promise.all(batch.map(u => sendEmail(u.email, input.subject,
        "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'><h2 style='color:#f97316'>SurveyEarn Pro</h2><p>Hi " + (u.name ?? "there") + ",</p><div>" + input.body.replace(/\\n/g, "<br>") + "</div><p style='color:#999;font-size:12px;margin-top:24px'>- The SurveyEarn Team</p></div>"
      )));
    }
    return { success: true, sent: emails.length };
  }),
});
`;
fs.writeFileSync("server/routers/admin.ts", content, "utf8");
console.log("Done! admin.ts written successfully.");