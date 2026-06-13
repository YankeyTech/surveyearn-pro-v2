import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Wallet balances per user (in USD cents to avoid float issues)
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceCents: int("balanceCents").notNull().default(0), // stored in cents
  totalEarnedCents: int("totalEarnedCents").notNull().default(0),
  totalWithdrawnCents: int("totalWithdrawnCents").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

// Every credit/debit event
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["survey_credit", "withdrawal_debit", "adjustment"]).notNull(),
  amountCents: int("amountCents").notNull(), // positive = credit, negative = debit
  // CPX-specific fields (populated on survey_credit)
  cpxTransId: varchar("cpxTransId", { length: 128 }),
  cpxSurveyId: varchar("cpxSurveyId", { length: 128 }),
  cpxEarningCents: int("cpxEarningCents"), // raw CPX reward in cents
  status: mysqlEnum("status", ["pending", "completed", "reversed"]).notNull().default("completed"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;

// Withdrawal requests
export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amountCents: int("amountCents").notNull(),
  method: varchar("method", { length: 64 }).notNull(), // e.g. "mobile_money", "bank_transfer"
  accountDetails: text("accountDetails").notNull(), // JSON string with account info
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"]).notNull().default("pending"),
  adminNote: text("adminNote"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
