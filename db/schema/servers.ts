import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const serversTable = sqliteTable("servers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	locationCity: text(),
	locationCountry: text().notNull(),
	ipv4: text().notNull(),
	ipv6: text().notNull(),
	connectionLink: text().notNull(),
});

export type ServerEntity = InferSelectModel<typeof serversTable>;

export type NewServer = InferInsertModel<typeof serversTable>;
