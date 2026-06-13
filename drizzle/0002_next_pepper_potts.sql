CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amountCents` int NOT NULL,
	`method` varchar(64) NOT NULL,
	`accountDetails` text NOT NULL,
	`status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `adPlacements`;--> statement-breakpoint
DROP TABLE `auditLogs`;--> statement-breakpoint
DROP TABLE `dailyEarningCaps`;--> statement-breakpoint
DROP TABLE `fraudLogs`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `referralSignups`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
DROP TABLE `rewards`;--> statement-breakpoint
DROP TABLE `surveyQuestions`;--> statement-breakpoint
DROP TABLE `surveyResponses`;--> statement-breakpoint
DROP TABLE `surveys`;--> statement-breakpoint
DROP TABLE `withdrawalRequests`;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `type` enum('survey_credit','withdrawal_debit','adjustment') NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `amountCents` int NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `cpxTransId` varchar(128);--> statement-breakpoint
ALTER TABLE `transactions` ADD `cpxSurveyId` varchar(128);--> statement-breakpoint
ALTER TABLE `transactions` ADD `cpxEarningCents` int;--> statement-breakpoint
ALTER TABLE `transactions` ADD `status` enum('pending','completed','reversed') DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `note` text;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `wallets` ADD `balanceCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wallets` ADD `totalEarnedCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wallets` ADD `totalWithdrawnCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `amount`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `relatedSurveyId`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `relatedWithdrawalId`;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `expiryDate`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `profilePictureUrl`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `isVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `isSuspended`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `isBanned`;--> statement-breakpoint
ALTER TABLE `wallets` DROP COLUMN `currentBalance`;--> statement-breakpoint
ALTER TABLE `wallets` DROP COLUMN `totalEarned`;--> statement-breakpoint
ALTER TABLE `wallets` DROP COLUMN `totalRedeemed`;--> statement-breakpoint
ALTER TABLE `wallets` DROP COLUMN `createdAt`;