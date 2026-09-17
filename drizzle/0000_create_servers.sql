CREATE TABLE `servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text,
	`remark` text NOT NULL,
	`country_tag` text NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`latitude` integer DEFAULT 0 NOT NULL,
	`longitude` integer DEFAULT 0 NOT NULL,
	`connectionLink` text NOT NULL,
	`inbound_id` integer,
	`type` text DEFAULT 'traveler_vpn'
);
