CREATE TABLE `adPlacements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location` enum('survey_page_banner','survey_page_interstitial','dashboard_sidebar','dashboard_banner') NOT NULL,
	`adNetwork` varchar(100),
	`placementId` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adPlacements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetType` varchar(100),
	`targetId` int,
	`changes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyEarningCaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalEarned` int NOT NULL DEFAULT 0,
	`surveyCompletionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyEarningCaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraudLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`ipAddress` varchar(45) NOT NULL,
	`deviceFingerprint` varchar(255) NOT NULL,
	`userAgent` text,
	`action` enum('survey_completion','signup','withdrawal_request') NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`flags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraudLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('survey_available','reward_approved','referral_bonus','withdrawal_status','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedSurveyId` int,
	`relatedWithdrawalId` int,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`bonusPointsAwarded` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralSignups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`referralUrl` text NOT NULL,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalSignups` int NOT NULL DEFAULT 0,
	`totalEarnings` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('gift_card','cash','paypal') NOT NULL,
	`pointsRequired` int NOT NULL,
	`cashValue` decimal(10,2),
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`questionNumber` int NOT NULL,
	`type` enum('multiple_choice','rating','open_text','checkbox','dropdown') NOT NULL,
	`questionText` text NOT NULL,
	`description` text,
	`isRequired` boolean NOT NULL DEFAULT true,
	`options` json,
	`ratingScale` int,
	`conditionalLogic` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`answers` json,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveyResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`pointsReward` int NOT NULL,
	`estimatedDurationMinutes` int,
	`category` varchar(100),
	`status` enum('draft','published','archived','paused') NOT NULL DEFAULT 'draft',
	`quota` int,
	`completedCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	`archivedAt` timestamp,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('survey_completion','referral_bonus','redemption','withdrawal','adjustment') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`relatedSurveyId` int,
	`relatedWithdrawalId` int,
	`expiryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentBalance` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalRedeemed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `withdrawalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`pointsDeducted` int NOT NULL,
	`method` enum('paypal','bank_transfer','gift_card') NOT NULL,
	`status` enum('pending','approved','rejected','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentDetails` json,
	`rejectionReason` text,
	`approvedBy` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawalRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `profilePictureUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuspended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;