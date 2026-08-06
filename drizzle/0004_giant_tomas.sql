ALTER TABLE `products` ADD `manufacturer` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `officialUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `products` ADD `licensing` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `requirements` text;--> statement-breakpoint
ALTER TABLE `products` ADD `seoTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `seoDescription` varchar(500);--> statement-breakpoint
ALTER TABLE `products` ADD `seoKeywords` text;--> statement-breakpoint
ALTER TABLE `products` ADD `faqs` text;--> statement-breakpoint
ALTER TABLE `products` ADD `qualityScore` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceDocument` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `lastPdsSyncAt` timestamp;