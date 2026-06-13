import {
  int, mysqlEnum, mysqlTable, text,
  timestamp, varchar, boolean,
} from "drizzle-orm/mysql-core";
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isSuspended: boolean("isSuspended").notNull().default(false),
  isBanned: boolean("isBanned").notNull().default(false),
  isVerified: boolean("isVerified").notNull().default(false),
  profilePictureUrl: varchar("profilePictureUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
lastCheckinAt: timestamp("lastCheckinAt"),
  streakCount: int("streakCount").notNull().default(0),
  streakLastDate: varchar("streakLastDate", { length: 10 }),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceCents: int("balanceCents").notNull().default(0),
  totalEarnedCents: int("totalEarnedCents").notNull().default(0),
  totalWithdrawnCents: int("totalWithdrawnCents").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Wallet = typeof wallets.$inferSelect;
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["survey_credit", "withdrawal_debit", "adjustment", "daily_checkin"]).notNull(),
  amountCents: int("amountCents").notNull(),
  cpxTransId: varchar("cpxTransId", { length: 128 }),
  cpxSurveyId: varchar("cpxSurveyId", { length: 128 }),
  cpxEarningCents: int("cpxEarningCents"),
  status: mysqlEnum("status", ["pending", "completed", "reversed"]).notNull().default("completed"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amountCents: int("amountCents").notNull(),
  method: varchar("method", { length: 64 }).notNull(),
  accountDetails: text("accountDetails").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"]).notNull().default("pending"),
  adminNote: text("adminNote"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});
export type Withdrawal = typeof withdrawals.$inferSelect;