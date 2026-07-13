ALTER TABLE `b2bLeads` ADD `ipHash` varchar(64);--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmSyncStatus` enum('pending','synced','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmSyncAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmLeadId` int;--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmLastError` text;--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmSyncedAt` timestamp;--> statement-breakpoint
ALTER TABLE `b2bLeads` ADD `crmLastAttemptAt` timestamp;