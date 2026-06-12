import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  wallets,
  surveys,
  surveyQuestions,
  surveyResponses,
  transactions,
  withdrawalRequests,
  referrals,
  referralSignups,
  notifications,
  fraudLogs,
  dailyEarningCaps,
  auditLogs,
  rewards,
  adPlacements,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if const mysql = await import("mysql2/promise");
const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
_db = drizzle(connection); {
    try {
      const mysql2 = require("mysql2/promise");
      const connection = mysql2.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(connection);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    // Ensure wallet exists for new users
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .limit(1);

    if (existingUser.length > 0) {
      const userId = existingUser[0].id;
      const existingWallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1);

      if (existingWallet.length === 0) {
        await db.insert(wallets).values({
          userId,
          currentBalance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
        });
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new user with email/password, plus their wallet and referral record.
 * Returns the created user.
 */
export async function createEmailUser(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: "user",
    isVerified: false,
    isSuspended: false,
    isBanned: false,
  });

  const user = await getUserByEmail(data.email);
  if (!user) throw new Error("Failed to create user");

  // Create wallet
  await db.insert(wallets).values({
    userId: user.id,
    currentBalance: 0,
    totalEarned: 0,
    totalRedeemed: 0,
  });

  // Create referral record with a unique code
  const referralCode = `${data.openId.slice(0, 8)}${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(referrals).values({
    referrerId: user.id,
    referralCode,
    referralUrl: `/register?ref=${referralCode}`,
    totalClicks: 0,
    totalSignups: 0,
    totalEarnings: "0",
  });

  return user;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserWallet(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPublishedSurveys(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveys)
    .where(eq(surveys.status, "published"))
    .orderBy(desc(surveys.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getSurveyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getSurveyQuestions(surveyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(surveyQuestions.questionNumber);
}

export async function getUserSurveyResponse(userId: number, surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveyResponses)
    .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.surveyId, surveyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTransactionHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getPendingWithdrawalRequests(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.status, "pending"))
    .orderBy(withdrawalRequests.createdAt)
    .limit(limit);
}

export async function getWithdrawalRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserReferral(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getReferralByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, code))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getDailyEarningCap(userId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(dailyEarningCaps)
    .where(and(eq(dailyEarningCaps.userId, userId), eq(dailyEarningCaps.date, date)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getFraudLogsByIp(ipAddress: string, hoursBack = 24) {
  const db = await getDb();
  if (!db) return [];

  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return await db
    .select()
    .from(fraudLogs)
    .where(and(eq(fraudLogs.ipAddress, ipAddress), gte(fraudLogs.createdAt, cutoffTime)));
}

export async function getFraudLogsByDeviceFingerprint(fingerprint: string, hoursBack = 24) {
  const db = await getDb();
  if (!db) return [];

  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return await db
    .select()
    .from(fraudLogs)
    .where(
      and(eq(fraudLogs.deviceFingerprint, fingerprint), gte(fraudLogs.createdAt, cutoffTime))
    );
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActiveRewards() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(rewards)
    .where(eq(rewards.isActive, true))
    .orderBy(rewards.displayOrder);
}

export async function getAdPlacements() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adPlacements)
    .where(eq(adPlacements.isActive, true));
}

export async function createAuditLog(
  adminId: number,
  action: string,
  targetType?: string,
  targetId?: number,
  changes?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    adminId,
    action,
    targetType,
    targetId,
    changes: changes ? JSON.stringify(changes) : undefined,
  });
}

export async function getPlatformAnalytics() {
  const db = await getDb();
  if (!db)
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSurveys: 0,
      completedSurveys: 0,
      totalPointsDistributed: 0,
      totalWithdrawalsProcessed: 0,
    };

  const totalUsers = await db
    .select({ count: sql`COUNT(*)` })
    .from(users);

  const totalSurveys = await db
    .select({ count: sql`COUNT(*)` })
    .from(surveys);

  const totalPointsDistributed = await db
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(eq(transactions.type, "survey_completion"));

  const completedSurveys = await db
    .select({ count: sql`COUNT(*)` })
    .from(surveyResponses)
    .where(eq(surveyResponses.status, "completed"));

  return {
    totalUsers: Number(totalUsers[0]?.count || 0),
    activeUsers: Number(totalUsers[0]?.count || 0), // Simplified for now
    totalSurveys: Number(totalSurveys[0]?.count || 0),
    completedSurveys: Number(completedSurveys[0]?.count || 0),
    totalPointsDistributed: Number(totalPointsDistributed[0]?.total || 0),
    totalWithdrawalsProcessed: 0, // Can be calculated from withdrawalRequests
  };
}
