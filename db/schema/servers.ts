import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const serversTable = sqliteTable("servers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	flag: text(),
	remark: text().notNull(),
	contryTag: text("country_tag").notNull(),
	connectionLink: text().notNull(),
	inboundId: integer("inbound_id"),
});

export type ServerEntity = InferSelectModel<typeof serversTable>;

export type NewServer = InferInsertModel<typeof serversTable>;
