import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { transactions } from "../../drizzle/schema";

const CPX_APP_ID = process.env.CPX_APP_ID ?? "33680";
const CPX_APP_SECURE_HASH = process.env.CPX_APP_SECURE_HASH ?? "";

export const surveyRouter = router({
  iframeUrl: protectedProcedure.query(({ ctx }) => {
    const extUserId = String(ctx.user.id);
    const secureHash = crypto
      .createHash("md5")
      .update(`${extUserId}-${CPX_APP_SECURE_HASH}`)
      .digest("hex");

    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: extUserId,
      secure_hash: secureHash,
      username: ctx.user.name ?? "",
      email: ctx.user.email ?? "",
      subid_1: "",
      subid_2: "",
    });

    return {
      url: `https://offers.cpx-research.com/index.php?${params.toString()}`,
      appId: CPX_APP_ID,
      extUserId,
    };
  }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.type, "survey_credit"))
        .orderBy(desc(transactions.createdAt))
        .limit(100);

      return rows.map((t) => ({
        id: t.id,
        title: `CPX Survey #${t.cpxSurveyId ?? t.id}`,
        pointsReward: t.amountCents,
        estimatedDurationMinutes: null,
        category: "CPX Research",
        status: "published",
        completedCount: 1,
        cpxSurveyId: t.cpxSurveyId,
        createdAt: t.createdAt,
      }));
    }),
});