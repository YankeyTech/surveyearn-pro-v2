import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table with role-based access control
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  profilePictureUrl: text("profilePictureUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  isSuspended: boolean("isSuspended").default(false).notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Referral system: tracks unique referral links and relationships
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  referralUrl: text("referralUrl").notNull(),
  totalClicks: int("totalClicks").default(0).notNull(),
  totalSignups: int("totalSignups").default(0).notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Referral tracking: records each signup through a referral link
 */
export const referralSignups = mysqlTable("referralSignups", {
  id: int("id").autoincrement().primaryKey(),
  referralId: int("referralId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  bonusPointsAwarded: int("bonusPointsAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralSignup = typeof referralSignups.$inferSelect;
export type InsertReferralSignup = typeof referralSignups.$inferInsert;

/**
 * User wallet: tracks current points balance
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentBalance: int("currentBalance").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalRedeemed: int("totalRedeemed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Transaction history: detailed record of all point movements
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["survey_completion", "referral_bonus", "redemption", "withdrawal", "adjustment"]).notNull(),
  amount: int("amount").notNull(),
  description: text("description"),
  relatedSurveyId: int("relatedSurveyId"),
  relatedWithdrawalId: int("relatedWithdrawalId"),
  expiryDate: timestamp("expiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Surveys: core survey content
 */
export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  pointsReward: int("pointsReward").notNull(),
  estimatedDurationMinutes: int("estimatedDurationMinutes"),
  category: varchar("category", { length: 100 }),
  status: mysqlEnum("status", ["draft", "published", "archived", "paused"]).default("draft").notNull(),
  quota: int("quota"),
  completedCount: int("completedCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
  archivedAt: timestamp("archivedAt"),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

/**
 * Survey questions: supports multiple question types
 */
export const surveyQuestions = mysqlTable("surveyQuestions", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  questionNumber: int("questionNumber").notNull(),
  type: mysqlEnum("type", ["multiple_choice", "rating", "open_text", "checkbox", "dropdown"]).notNull(),
  questionText: text("questionText").notNull(),
  description: text("description"),
  isRequired: boolean("isRequired").default(true).notNull(),
  options: json("options"), // For multiple_choice, checkbox, dropdown: array of {id, label}
  ratingScale: int("ratingScale"), // For rating: 1-10, 1-5, etc.
  conditionalLogic: json("conditionalLogic"), // For branching logic
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = typeof surveyQuestions.$inferInsert;

/**
 * Survey responses: tracks user completion of surveys
 */
export const surveyResponses = mysqlTable("surveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  answers: json("answers"), // Array of {questionId, answer}
  pointsEarned: int("pointsEarned").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

/**
 * Withdrawal requests: tracks redemption requests
 */
export const withdrawalRequests = mysqlTable("withdrawalRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pointsDeducted: int("pointsDeducted").notNull(),
  method: mysqlEnum("method", ["paypal", "bank_transfer", "gift_card"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed", "failed"]).default("pending").notNull(),
  paymentDetails: json("paymentDetails"), // PayPal email, bank account, gift card preference
  rejectionReason: text("rejectionReason"),
  approvedBy: int("approvedBy"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

/**
 * Fraud detection: tracks IP addresses and device fingerprints
 */
export const fraudLogs = mysqlTable("fraudLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  deviceFingerprint: varchar("deviceFingerprint", { length: 255 }).notNull(),
  userAgent: text("userAgent"),
  action: mysqlEnum("action", ["survey_completion", "signup", "withdrawal_request"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low").notNull(),
  flags: json("flags"), // Array of detected issues: duplicate_ip, duplicate_device, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FraudLog = typeof fraudLogs.$inferSelect;
export type InsertFraudLog = typeof fraudLogs.$inferInsert;

/**
 * Daily earning caps: tracks user earnings per day for fraud prevention
 */
export const dailyEarningCaps = mysqlTable("dailyEarningCaps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalEarned: int("totalEarned").default(0).notNull(),
  surveyCompletionCount: int("surveyCompletionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyEarningCap = typeof dailyEarningCaps.$inferSelect;
export type InsertDailyEarningCap = typeof dailyEarningCaps.$inferInsert;

/**
 * Notifications: in-app alert system
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["survey_available", "reward_approved", "referral_bonus", "withdrawal_status", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedSurveyId: int("relatedSurveyId"),
  relatedWithdrawalId: int("relatedWithdrawalId"),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Admin audit logs: tracks admin actions for compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetType: varchar("targetType", { length: 100 }), // user, survey, withdrawal, etc.
  targetId: int("targetId"),
  changes: json("changes"), // Before/after values
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Ad placements: configuration for ad slots
 */
export const adPlacements = mysqlTable("adPlacements", {
  id: int("id").autoincrement().primaryKey(),
  location: mysqlEnum("location", ["survey_page_banner", "survey_page_interstitial", "dashboard_sidebar", "dashboard_banner"]).notNull(),
  adNetwork: varchar("adNetwork", { length: 100 }), // google_adsense, meta_audience_network, etc.
  placementId: varchar("placementId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdPlacement = typeof adPlacements.$inferSelect;
export type InsertAdPlacement = typeof adPlacements.$inferInsert;

/**
 * Rewards catalog: available gift cards and cash options
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["gift_card", "cash", "paypal"]).notNull(),
  pointsRequired: int("pointsRequired").notNull(),
  cashValue: decimal("cashValue", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;
