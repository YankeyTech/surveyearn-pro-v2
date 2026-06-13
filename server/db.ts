import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import {
  InsertUser, users,
  surveys, surveyQuestions, surveyResponses,
  wallets, transactions, referrals, referralSignups,
  withdrawalRequests, notifications, auditLogs,
  fraudLogs, dailyEarningCaps, rewards
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const pool = (mysql as any).createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmailUser(data: {
  openId: string; name: string; email: string; passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  const result = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  if (!result[0]) throw new Error("Failed to create user");
  // Create wallet for new user
  await db.insert(wallets).values({ userId: result[0].id }).onDuplicateKeyUpdate({ set: { userId: result[0].id } });
  return result[0];
}

export async function getAllUsers(limit: number, offset: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).limit(limit).offset(offset);
}

// ── Surveys ────────────────────────────────────────────────────────────────

export async function getPublishedSurveys(limit: number, offset: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surveys)
    .where(eq(surveys.status, "published"))
    .limit(limit).offset(offset);
}

export async function getSurveyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSurveyQuestions(surveyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(surveyQuestions.questionNumber);
}

export async function getUserSurveyResponse(userId: number, surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveyResponses)
    .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.surveyId, surveyId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Wallet & Transactions ──────────────────────────────────────────────────

export async function getUserWallet(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTransactionHistory(userId: number, limit: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

// ── Referrals ──────────────────────────────────────────────────────────────

export async function getUserReferral(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(referrals).where(eq(referrals.referrerId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Withdrawals ────────────────────────────────────────────────────────────

export async function getWithdrawalRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingWithdrawalRequests(limit: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(withdrawalRequests)
    .where(eq(withdrawalRequests.status, "pending"))
    .limit(limit);
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function getUserNotifications(userId: number, limit: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// ── Daily Earning Caps ─────────────────────────────────────────────────────

export async function getDailyEarningCap(userId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyEarningCaps)
    .where(and(eq(dailyEarningCaps.userId, userId), eq(dailyEarningCaps.date, date)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export async function createAuditLog(
  adminId: number, action: string, targetType: string,
  targetId?: number, changes?: any
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ adminId, action, targetType, targetId, changes });
}

export async function setUserRole(email: string, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.email, email));
}

// ── Analytics ──────────────────────────────────────────────────────────────

export async function getPlatformAnalytics() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalSurveys: 0, totalResponses: 0, pendingWithdrawals: 0 };
  const [userCount] = await db.select().from(users).limit(1);
  const allUsers = await db.select().from(users);
  const allSurveys = await db.select().from(surveys);
  const allResponses = await db.select().from(surveyResponses);
  const pendingW = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending"));
  return {
    totalUsers: allUsers.length,
    totalSurveys: allSurveys.length,
    totalResponses: allResponses.length,
    pendingWithdrawals: pendingW.length,
  };
}
