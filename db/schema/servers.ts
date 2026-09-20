import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const serversTable = sqliteTable("servers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	address: text(),
	remark: text().notNull(),
	countryTag: text("country_tag").notNull(),
	country: text().notNull().default(""),
	city: text().notNull().default(""),
	latitude: integer().notNull().default(0),
	longitude: integer().notNull().default(0),
	connectionLink: text().notNull(),
	inboundId: integer("inbound_id"),
	type: text("type", { enum: ["traveler_vpn", "user_defined"] }).default(
		"traveler_vpn",
	),
});

export type ServerEntity = InferSelectModel<typeof serversTable>;

export type NewServer = InferInsertModel<typeof serversTable>;
