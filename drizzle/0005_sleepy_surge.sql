CREATE TABLE `pdsAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdsImportId` int NOT NULL,
	`action` enum('upload','analyze','approve','reject','apply','fail') NOT NULL,
	`actorUserId` int NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdsAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdsImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileHash` varchar(64) NOT NULL,
	`modelId` varchar(100),
	`status` enum('uploaded','analyzing','review','approved','rejected','applied','failed') NOT NULL DEFAULT 'uploaded',
	`extractedText` text,
	`parsedData` text,
	`changePreview` text,
	`warnings` text,
	`errorMessage` text,
	`createdByUserId` int NOT NULL,
	`reviewedByUserId` int,
	`approvedAt` timestamp,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdsImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`mediaType` enum('case','video') NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text,
	`customerName` varchar(255),
	`resultText` text,
	`sourceUrl` varchar(1000) NOT NULL,
	`embedUrl` varchar(1000),
	`imageUrl` varchar(1000),
	`isOfficial` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sourceType` enum('public','internal') NOT NULL,
	`planName` varchar(255) NOT NULL,
	`minSeats` int NOT NULL DEFAULT 1,
	`maxSeats` int,
	`billingPeriod` enum('monthly','annual','custom') NOT NULL DEFAULT 'annual',
	`currency` varchar(3) NOT NULL,
	`sourceAmount` decimal(14,4) NOT NULL,
	`exchangeRate` decimal(14,6),
	`taxRate` decimal(8,4) NOT NULL DEFAULT '0',
	`operationalCostRate` decimal(8,4) NOT NULL DEFAULT '0',
	`marginRate` decimal(8,4) NOT NULL DEFAULT '0',
	`calculatedCostBrl` decimal(14,2),
	`suggestedPriceBrl` decimal(14,2),
	`approvedPriceBrl` decimal(14,2),
	`status` enum('draft','in_review','approved','published') NOT NULL DEFAULT 'draft',
	`isPublic` boolean NOT NULL DEFAULT false,
	`sourceLabel` varchar(255),
	`sourceUrl` varchar(1000),
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`publishedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`pdsImportId` int,
	`versionNumber` int NOT NULL,
	`snapshot` text NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productVersions_id` PRIMARY KEY(`id`)
);
