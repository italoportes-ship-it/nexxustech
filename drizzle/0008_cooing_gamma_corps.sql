ALTER TABLE `licenses` ADD `quantity` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerSnapshotEncrypted` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `termsAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `privacyAcceptedAt` timestamp;