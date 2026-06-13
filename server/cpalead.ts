import type { Express } from "express";
import * as db from "./db";
import { getDb } from "./db";
import { transactions, wallets } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const CPALEAD_PASSWORD = process.env.CPALEAD_PASSWORD || "surveyearn2026";

export function registerCPALeadPostback(app: Express) {
  app.get("/api/cpalead/postback", async (req, res) => {
    try {
      const { user_id, amount, trans_id, campaign, password } = req.query as Record<string, string>;

      // Verify password
      if (password !== CPALEAD_PASSWORD) {
        console.warn("[CPALead] Invalid password:", password);
        return res.status(403).send("INVALID_PASSWORD");
      }

      if (!user_id || !amount || !trans_id) {
        return res.status(400).send("MISSING_PARAMS");
      }

      const userId = parseInt(user_id);
      if (isNaN(userId)) return res.status(400).send("INVALID_USER_ID");

      // Convert payout in dollars to cents
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (amountCents <= 0) return res.status(400).send("INVALID_AMOUNT");

      const dbInstance = await getDb();

      // Idempotency — check if trans_id already processed
      const existing = await dbInstance.select().from(transactions)
        .where(eq(transactions.cpxTransId, trans_id));
      if (existing.length > 0) {
        console.log("[CPALead] Duplicate trans_id:", trans_id);
        return res.send("OK");
      }

      // Credit wallet
      await dbInstance.update(wallets)
        .set({
          balanceCents: sql`balanceCents + ${amountCents}`,
          totalEarnedCents: sql`totalEarnedCents + ${amountCents}`,
        })
        .where(eq(wallets.userId, userId));

      // Record transaction
      await dbInstance.insert(transactions).values({
        userId,
        type: "survey_credit",
        amountCents,
        cpxTransId: trans_id,
        cpxSurveyId: campaign || "cpalead",
        status: "completed",
        note: "CPALead offer: " + (campaign || "unknown"),
      });

      console.log(`[CPALead] Credited user ${userId} with ${amountCents} cents (trans: ${trans_id})`);
      return res.send("OK");
    } catch (err: any) {
      console.error("[CPALead] Postback error:", err.message);
      return res.status(500).send("ERROR");
    }
  });
}
