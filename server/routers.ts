import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, adminProcedure } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { surveys, surveyResponses, transactions, wallets, referrals, referralSignups, withdrawalRequests, users, notifications, fraudLogs, dailyEarningCaps } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// Helper Functions
// ============================================================================

function generateDeviceFingerprint(userAgent: string, acceptLanguage: string): string {
  return Buffer.from(`${userAgent}|${acceptLanguage}`).toString("base64");
}

function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

async function recordFraudLog(
  userId: number | undefined,
  ipAddress: string,
  deviceFingerprint: string,
  action: "survey_completion" | "signup" | "withdrawal_request",
  flags: string[]
) {
  const dbInstance = await getDb();
  if (!dbInstance) return;

  const riskLevel = flags.length > 2 ? "high" : flags.length > 0 ? "medium" : "low";

  await dbInstance.insert(fraudLogs).values({
    userId: userId || undefined,
    ipAddress,
    deviceFingerprint,
    action,
    riskLevel,
    flags: JSON.stringify(flags),
  });
}

// ============================================================================
// Auth Router
// ============================================================================

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ============================================================================
// User Router
// ============================================================================

const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await dbInstance
        .update(users)
        .set({
          name: input.name,
          email: input.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  uploadProfilePicture: protectedProcedure
    .input(z.object({ file: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const buffer = Buffer.from(input.file, "base64");
        const { url } = await storagePut(`users/${ctx.user.id}/profile.jpg`, buffer, "image/jpeg");

        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await dbInstance
          .update(users)
          .set({ profilePictureUrl: url, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));

        return { url, success: true };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload image" });
      }
    }),
});

// ============================================================================
// Survey Router
// ============================================================================

const surveyRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return await db.getPublishedSurveys(input.limit, input.offset);
    }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const survey = await db.getSurveyById(input.id);
    if (!survey) throw new TRPCError({ code: "NOT_FOUND" });

    const questions = await db.getSurveyQuestions(input.id);
    return { ...survey, questions };
  }),

  startResponse: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const survey = await db.getSurveyById(input.surveyId);
      if (!survey || survey.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if user already completed this survey
      const existing = await db.getUserSurveyResponse(ctx.user.id, input.surveyId);
      if (existing && existing.status === "completed") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already completed this survey",
        });
      }

      // Check daily earning cap (5 surveys per day max)
      const today = getTodayDate();
      const dailyCap = await db.getDailyEarningCap(ctx.user.id, today);
      if (dailyCap && dailyCap.surveyCompletionCount >= 5) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Daily survey limit reached. Try again tomorrow.",
        });
      }

      if (existing) {
        return existing;
      }

      // Create new survey response
      const result = await dbInstance.insert(surveyResponses).values({
        surveyId: input.surveyId,
        userId: ctx.user.id,
        status: "in_progress",
        answers: JSON.stringify([]),
        pointsEarned: 0,
      });

      const newResponse = await dbInstance
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.userId, ctx.user.id))
        .limit(1);

      return newResponse[0] || { id: 1, surveyId: input.surveyId, userId: ctx.user.id };
    }),

  submitResponse: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        answers: z.array(z.object({ questionId: z.number(), answer: z.any() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const survey = await db.getSurveyById(input.surveyId);
      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });

      const wallet = await db.getUserWallet(ctx.user.id);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND" });

      // Update survey response
      const response = await db.getUserSurveyResponse(ctx.user.id, input.surveyId);
      if (!response) throw new TRPCError({ code: "NOT_FOUND" });

      await dbInstance
        .update(surveyResponses)
        .set({
          status: "completed",
          answers: JSON.stringify(input.answers),
          pointsEarned: survey.pointsReward,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(surveyResponses.id, response.id));

      // Add points to wallet
      await dbInstance
        .update(wallets)
        .set({
          currentBalance: wallet.currentBalance + survey.pointsReward,
          totalEarned: wallet.totalEarned + survey.pointsReward,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, ctx.user.id));

      // Create transaction record
      await dbInstance.insert(transactions).values({
        userId: ctx.user.id,
        type: "survey_completion",
        amount: survey.pointsReward,
        description: `Completed survey: ${survey.title}`,
        relatedSurveyId: input.surveyId,
      });

      // Update survey completion count
      await dbInstance
        .update(surveys)
        .set({
          completedCount: survey.completedCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(surveys.id, input.surveyId));

      // Update daily earning cap
      const today = getTodayDate();
      const dailyCap = await db.getDailyEarningCap(ctx.user.id, today);

      if (dailyCap) {
        await dbInstance
          .update(dailyEarningCaps)
          .set({
            totalEarned: dailyCap.totalEarned + survey.pointsReward,
            surveyCompletionCount: dailyCap.surveyCompletionCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(dailyEarningCaps.id, dailyCap.id));
      } else {
        await dbInstance.insert(dailyEarningCaps).values({
          userId: ctx.user.id,
          date: today,
          totalEarned: survey.pointsReward,
          surveyCompletionCount: 1,
        });
      }

      return { success: true, pointsEarned: survey.pointsReward };
    }),
});

// ============================================================================
// Wallet Router
// ============================================================================

const walletRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await db.getUserWallet(ctx.user.id);
    if (!wallet) throw new TRPCError({ code: "NOT_FOUND" });
    return wallet;
  }),

  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await db.getUserTransactionHistory(ctx.user.id, input.limit);
    }),
});

// ============================================================================
// Referral Router
// ============================================================================

const referralRouter = router({
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    let referral = await db.getUserReferral(ctx.user.id);

    if (!referral) {
      const code = nanoid(8);
      const url = `${process.env.VITE_FRONTEND_URL || "http://localhost:5173"}/signup?ref=${code}`;

      const result = await dbInstance.insert(referrals).values({
        referrerId: ctx.user.id,
        referralCode: code,
        referralUrl: url,
        totalClicks: 0,
        totalSignups: 0,
        totalEarnings: "0",
      });

      referral = await db.getUserReferral(ctx.user.id);
    }

    return referral;
  }),

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const referral = await db.getUserReferral(ctx.user.id);
    if (!referral) {
      return { totalClicks: 0, totalSignups: 0, totalEarnings: 0 };
    }

    return {
      totalClicks: referral.totalClicks,
      totalSignups: referral.totalSignups,
      totalEarnings: Number(referral.totalEarnings),
    };
  }),
});

// ============================================================================
// Withdrawal Router
// ============================================================================

const withdrawalRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(5, "Minimum withdrawal is $5"),
        method: z.enum(["paypal", "bank_transfer", "gift_card"]),
        paymentDetails: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const wallet = await db.getUserWallet(ctx.user.id);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND" });

      const pointsNeeded = Math.ceil(input.amount * 100);
      if (wallet.currentBalance < pointsNeeded) {
        throw new TRPCError({ code: "CONFLICT", message: "Insufficient balance" });
      }

      const result = await dbInstance.insert(withdrawalRequests).values({
        userId: ctx.user.id,
        amount: input.amount.toString(),
        pointsDeducted: pointsNeeded,
        method: input.method,
        status: "pending",
        paymentDetails: JSON.stringify(input.paymentDetails),
      });

      // Create notification
      await dbInstance.insert(notifications).values({
        userId: ctx.user.id,
        type: "withdrawal_status",
        title: "Withdrawal Request Submitted",
        message: `Your withdrawal request for $${input.amount} has been submitted and is pending approval.`,
      });

      return { success: true };
    }),

  getMyRequests: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) return [];

      return await dbInstance
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, ctx.user.id))
        .limit(input.limit);
    }),

  getRequestById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const request = await db.getWithdrawalRequestById(input.id);
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      return request;
    }),
});

// ============================================================================
// Admin Router
// ============================================================================

const adminRouter = router({
  listUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return await db.getAllUsers(input.limit, input.offset);
    }),

  suspendUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await dbInstance
        .update(users)
        .set({ isSuspended: true, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.createAuditLog(ctx.user.id, "suspend_user", "user", input.userId);
      return { success: true };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await dbInstance
        .update(users)
        .set({ isBanned: true, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.createAuditLog(ctx.user.id, "ban_user", "user", input.userId);
      return { success: true };
    }),

  createSurvey: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        pointsReward: z.number().min(1),
        estimatedDurationMinutes: z.number().optional(),
        category: z.string().optional(),
        quota: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await dbInstance.insert(surveys).values({
        title: input.title,
        description: input.description,
        pointsReward: input.pointsReward,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        category: input.category,
        quota: input.quota,
        status: "draft",
        createdBy: ctx.user.id,
      });

      await db.createAuditLog(ctx.user.id, "create_survey", "survey", undefined, input);
      return { success: true };
    }),

  publishSurvey: adminProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await dbInstance
        .update(surveys)
        .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(surveys.id, input.surveyId));

      await db.createAuditLog(ctx.user.id, "publish_survey", "survey", input.surveyId);
      return { success: true };
    }),

  getPendingWithdrawals: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await db.getPendingWithdrawalRequests(input.limit);
    }),

  approveWithdrawal: adminProcedure
    .input(z.object({ withdrawalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const withdrawal = await db.getWithdrawalRequestById(input.withdrawalId);
      if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND" });

      // Deduct points from wallet
      const wallet = await db.getUserWallet(withdrawal.userId);
      if (wallet) {
        await dbInstance
          .update(wallets)
          .set({
            currentBalance: Math.max(0, wallet.currentBalance - withdrawal.pointsDeducted),
            totalRedeemed: wallet.totalRedeemed + withdrawal.pointsDeducted,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, withdrawal.userId));
      }

      // Update withdrawal status
      await dbInstance
        .update(withdrawalRequests)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(withdrawalRequests.id, input.withdrawalId));

      // Create notification
      await dbInstance.insert(notifications).values({
        userId: withdrawal.userId,
        type: "withdrawal_status",
        title: "Withdrawal Approved",
        message: `Your withdrawal request for $${withdrawal.amount} has been approved!`,
        relatedWithdrawalId: input.withdrawalId,
      });

      await db.createAuditLog(ctx.user.id, "approve_withdrawal", "withdrawal", input.withdrawalId);
      return { success: true };
    }),

  rejectWithdrawal: adminProcedure
    .input(z.object({ withdrawalId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const withdrawal = await db.getWithdrawalRequestById(input.withdrawalId);
      if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND" });

      // Update withdrawal status
      await dbInstance
        .update(withdrawalRequests)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(withdrawalRequests.id, input.withdrawalId));

      // Create notification
      await dbInstance.insert(notifications).values({
        userId: withdrawal.userId,
        type: "withdrawal_status",
        title: "Withdrawal Rejected",
        message: `Your withdrawal request has been rejected. Reason: ${input.reason}`,
        relatedWithdrawalId: input.withdrawalId,
      });

      await db.createAuditLog(ctx.user.id, "reject_withdrawal", "withdrawal", input.withdrawalId, {
        reason: input.reason,
      });
      return { success: true };
    }),

  getAnalytics: adminProcedure.query(async () => {
    return await db.getPlatformAnalytics();
  }),
});

// ============================================================================
// Notification Router
// ============================================================================

const notificationRouter = router({
  getMyNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return await db.getUserNotifications(ctx.user.id, input.limit);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await dbInstance
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await dbInstance
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});

// ============================================================================
// Main App Router
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  user: userRouter,
  survey: surveyRouter,
  wallet: walletRouter,
  referral: referralRouter,
  withdrawal: withdrawalRouter,
  admin: adminRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
