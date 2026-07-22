import { eq } from "drizzle-orm";
import { db } from "../client";
import { NewServer, ServerEntity, serversTable } from "../schema/servers";

export const ServerDAO = {
	async getAll(): Promise<ServerEntity[]> {
		return db.select().from(serversTable).all();
	},

	async getById(id: number): Promise<ServerEntity> {
		const result = await db
			.select()
			.from(serversTable)
			.where(eq(serversTable.id, id));
		return result[0];
	},

	async add(server: NewServer) {
		await db.insert(serversTable).values(server);
	},

	async delete(server: ServerEntity) {
		await db.delete(serversTable).where(eq(serversTable.id, server.id));
	},

	async deleteAll() {
		await db.delete(serversTable);
	},

	async update(server: ServerEntity) {
		await db
			.update(serversTable)
			.set(server)
			.where(eq(serversTable.id, server.id));
	},
};
