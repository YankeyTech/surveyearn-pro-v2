const fs = require("fs");

// 1. Backend postback handler
const postbackHandler = `import type { Express } from "express";
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
          balanceCents: sql\`balanceCents + \${amountCents}\`,
          totalEarnedCents: sql\`totalEarnedCents + \${amountCents}\`,
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

      console.log(\`[CPALead] Credited user \${userId} with \${amountCents} cents (trans: \${trans_id})\`);
      return res.send("OK");
    } catch (err: any) {
      console.error("[CPALead] Postback error:", err.message);
      return res.status(500).send("ERROR");
    }
  });
}
`;

// 2. Frontend Offers page
const offersPage = `import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function OffersPage() {
  const { data: user } = trpc.auth.me.useQuery();

  useEffect(() => {
    // Load CPALead offerwall script
    const existing = document.getElementById("cpalead-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "cpalead-script";
      script.type = "text/javascript";
      script.src = "https://www.qckclk.com/offerwall-v2.js?bid=Ea6ho5D";
      document.body.appendChild(script);
    }
  }, []);

  const offerwallUrl = user
    ? \`https://www.qckclk.com/wall/Ea6ho5D?subid=\${user.id}\`
    : "https://www.qckclk.com/wall/Ea6ho5D";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        <p className="text-gray-500 mt-1">Complete offers below to earn rewards credited directly to your wallet.</p>
      </div>

      {!user && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          Please <a href="/login" className="font-medium underline">sign in</a> to earn rewards from offers.
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <iframe
          sandbox="allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          src={offerwallUrl}
          style={{ width: "100%", height: "750px", border: "none" }}
          frameBorder="0"
        />
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Rewards are credited automatically within a few minutes of offer completion.
      </div>
    </div>
  );
}
`;

fs.writeFileSync("server/cpalead.ts", postbackHandler, "utf8");
fs.writeFileSync("client/src/pages/OffersPage.tsx", offersPage, "utf8");
console.log("Done! server/cpalead.ts and client/src/pages/OffersPage.tsx written.");