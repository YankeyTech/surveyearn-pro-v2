 
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, wallets, transactions } from "../../drizzle/schema";

export async function creditReferralBonuses(referrerId: number, newUserId: number) {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Credit referrer $0.50
  await db.update(wallets)
    .set({
      balanceCents: eq(wallets.userId, referrerId) as any,
    });

  // Use raw SQL increment for safety
  await db.execute(
    `UPDATE wallets SET balanceCents = balanceCents + 50, totalEarnedCents = totalEarnedCents + 50 WHERE userId = ${referrerId}`
  );

  await db.insert(transactions).values({
    userId: referrerId,
    type: "referral_bonus",
    amountCents: 50,
    note: "Referral bonus — friend signed up",
    createdAt: now,
  });

  // Credit new user $0.25
  await db.execute(
    `UPDATE wallets SET balanceCents = balanceCents + 25, totalEarnedCents = totalEarnedCents + 25 WHERE userId = ${newUserId}`
  );

  await db.insert(transactions).values({
    userId: newUserId,
    type: "referral_bonus",
    amountCents: 25,
    note: "Welcome bonus — signed up via referral",
    createdAt: now,
  });

  // Mark bonus as paid
  await db.update(users)
    .set({ referralBonusPaid: true })
    .where(eq(users.id, newUserId));
}