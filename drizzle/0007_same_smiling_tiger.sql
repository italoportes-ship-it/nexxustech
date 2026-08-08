CREATE TABLE `commerceMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`messageType` enum('order_created','payment_confirmed','license_ready','invoice_ready') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('pending_configuration','pending','sent','failed') NOT NULL DEFAULT 'pending_configuration',
	`externalId` varchar(255),
	`errorMessage` varchar(1000),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerType` enum('person','company') NOT NULL DEFAULT 'person',
	`fullName` varchar(255) NOT NULL,
	`legalName` varchar(255),
	`email` varchar(320) NOT NULL,
	`taxIdEncrypted` text NOT NULL,
	`taxIdLast4` varchar(4) NOT NULL,
	`phoneEncrypted` text,
	`billingAddressEncrypted` text,
	`stripeCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`provider` enum('nfeio','focus','enotas','manual','unconfigured') NOT NULL DEFAULT 'unconfigured',
	`documentType` enum('nfse','nfe','other','pending') NOT NULL DEFAULT 'pending',
	`status` enum('pending_configuration','pending','processing','issued','failed','cancelled') NOT NULL DEFAULT 'pending_configuration',
	`externalId` varchar(255),
	`number` varchar(100),
	`pdfUrl` varchar(1000),
	`xmlStorageKey` varchar(1000),
	`errorMessage` varchar(1000),
	`issuedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`status` enum('pending_payment','awaiting_vendor','active','suspended','revoked') NOT NULL DEFAULT 'pending_payment',
	`entitlementTokenHash` varchar(64) NOT NULL,
	`entitlementTokenLast4` varchar(4) NOT NULL,
	`licenseKeyEncrypted` text,
	`licenseKeyLast4` varchar(4),
	`downloadUrl` varchar(1000),
	`installationInstructions` text,
	`activatedAt` timestamp,
	`deliveredAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenses_entitlementTokenHash_unique` UNIQUE(`entitlementTokenHash`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`provider` enum('stripe') NOT NULL DEFAULT 'stripe',
	`status` enum('pending','processing','succeeded','failed','cancelled','refunded','chargeback') NOT NULL DEFAULT 'pending',
	`externalSessionId` varchar(255),
	`externalPaymentIntentId` varchar(255),
	`externalChargeId` varchar(255),
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`paymentMethod` varchar(50),
	`failureCode` varchar(100),
	`failureMessage` varchar(500),
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_externalSessionId_unique` UNIQUE(`externalSessionId`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','nfeio','focus','enotas') NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(255) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`status` enum('received','processing','processed','ignored','failed') NOT NULL DEFAULT 'received',
	`orderId` int,
	`paymentId` int,
	`attempts` int NOT NULL DEFAULT 0,
	`errorMessage` varchar(1000),
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookEvents_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','paid','failed','cancelled','refunded','chargeback') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orderItems` ADD `productPriceId` int;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `planName` varchar(255);--> statement-breakpoint
ALTER TABLE `orderItems` ADD `unitPrice` decimal(12,2);--> statement-breakpoint
ALTER TABLE `orderItems` ADD `totalPrice` decimal(12,2);--> statement-breakpoint
ALTER TABLE `orderItems` ADD `currency` varchar(3) DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `licenseTerm` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `customerId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `orderNumber` varchar(40);--> statement-breakpoint
ALTER TABLE `orders` ADD `currency` varchar(3) DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotalAmount` decimal(12,2);--> statement-breakpoint
ALTER TABLE `orders` ADD `discountAmount` decimal(12,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `couponCode` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `idempotencyKey` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `sourceIpHash` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `userAgentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `internalNotes` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `checkoutCreatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `failedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `refundedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `chargebackAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_idempotencyKey_unique` UNIQUE(`idempotencyKey`);