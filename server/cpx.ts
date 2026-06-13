/**
 * CPX Research postback handler
 * Endpoint: POST/GET /api/cpx/postback
 *
 * CPX calls this URL when a user completes/reverses a survey.
 * Docs: https://publisher.cpx-research.com
 *
 * Query params from CPX:
 *   ext_user_id  – your user's ID
 *   trans_id     – CPX transaction ID (idempotency key)
 *   survey_id    – survey identifier
 *   reward       – reward amount in USD (e.g. "0.50")
 *   hash         – md5(trans_id + "-" + APP_SECURE_HASH) for verification
 *   status       – "1" = completed, "2" = reversed
 */

import crypto from "crypto";
import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { transactions, wallets, users } from "../drizzle/schema";

const CPX_APP_SECURE_HASH = process.env.CPX_APP_SECURE_HASH ?? "";
const CPX_APP_ID = process.env.CPX_APP_ID ?? "33680";

function verifyHash(transId: string, receivedHash: string): boolean {
  if (!CPX_APP_SECURE_HASH) {
    console.warn("[CPX] CPX_APP_SECURE_HASH not set – skipping hash verification");
    return true; // allow in dev
  }
  const expected = crypto
    .createHash("md5")
    .update(`${transId}-${CPX_APP_SECURE_HASH}`)
    .digest("hex");
  return expected === receivedHash;
}

export async function cpxPostbackHandler(req: Request, res: Response) {
  // CPX may send GET or POST; params are always in query string
  const {
    ext_user_id,
    trans_id,
    survey_id,
    reward,
    hash,
    status,
  } = req.query as Record<string, string>;

  // --- validation ---
  if (!ext_user_id || !trans_id || !reward || !hash) {
    console.warn("[CPX] Missing required params", req.query);
    return res.status(400).send("Missing params");
  }

  if (!verifyHash(trans_id, hash)) {
    console.warn("[CPX] Hash mismatch for trans_id", trans_id);
    return res.status(403).send("Invalid hash");
  }

  const db = await getDb();
  if (!db) {
    console.error("[CPX] DB unavailable");
    return res.status(500).send("DB error");
  }

  const userId = parseInt(ext_user_id, 10);
  if (isNaN(userId)) {
    return res.status(400).send("Bad ext_user_id");
  }

  // Confirm user exists
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRows.length) {
    console.warn("[CPX] Unknown user", userId);
    return res.status(404).send("User not found");
  }

  const rewardCents = Math.round(parseFloat(reward) * 100);
  const isReversal = status === "2";

  // Idempotency: check if this trans_id + status combo was already processed
  const existing = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.cpxTransId, trans_id),
        eq(transactions.type, isReversal ? "adjustment" : "survey_credit")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    console.log("[CPX] Duplicate postback ignored", trans_id);
    return res.send("OK"); // idempotent
  }

  if (isReversal) {
    // Deduct the reward
    await db.insert(transactions).values({
      userId,
      type: "adjustment",
      amountCents: -rewardCents,
      cpxTransId: trans_id,
      cpxSurveyId: survey_id ?? null,
      cpxEarningCents: rewardCents,
      status: "completed",
      note: "CPX reversal",
    });

    // Update wallet (clamp at 0)
    const walletRows = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (walletRows.length) {
      const newBalance = Math.max(0, walletRows[0].balanceCents - rewardCents);
      await db
        .update(wallets)
        .set({ balanceCents: newBalance })
        .where(eq(wallets.userId, userId));
    }
  } else {
    // Credit the reward
    await db.insert(transactions).values({
      userId,
      type: "survey_credit",
      amountCents: rewardCents,
      cpxTransId: trans_id,
      cpxSurveyId: survey_id ?? null,
      cpxEarningCents: rewardCents,
      status: "completed",
      note: "CPX survey completion",
    });

    // Upsert wallet
    const walletRows = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (walletRows.length) {
      await db
        .update(wallets)
        .set({
          balanceCents: walletRows[0].balanceCents + rewardCents,
          totalEarnedCents: walletRows[0].totalEarnedCents + rewardCents,
        })
        .where(eq(wallets.userId, userId));
    } else {
      await db.insert(wallets).values({
        userId,
        balanceCents: rewardCents,
        totalEarnedCents: rewardCents,
        totalWithdrawnCents: 0,
      });
    }
  }

  console.log(`[CPX] Postback processed: user=${userId} trans=${trans_id} reward=${reward} reversal=${isReversal}`);
  return res.send("OK");
}
