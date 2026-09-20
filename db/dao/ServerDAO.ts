import { and, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { NewServer, ServerEntity, serversTable } from "../schema/servers";

export const ServerDAO = {
	async getAll(): Promise<ServerEntity[]> {
		return db.select().from(serversTable).all();
	},

	async getById(id: number): Promise<ServerEntity | undefined> {
		const result = await db
			.select()
			.from(serversTable)
			.where(eq(serversTable.id, id))
			.get();

		return result;
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

	async deleteManaged() {
		await db
			.delete(serversTable)
			.where(eq(serversTable.type, "traveler_vpn"));
	},

	async deleteUserDefined(ids: number[]) {
		if (ids.length === 0) return;
		await db
			.delete(serversTable)
			.where(
				and(
					eq(serversTable.type, "user_defined"),
					inArray(serversTable.id, ids),
				),
			);
	},

	async update(server: ServerEntity) {
		await db
			.update(serversTable)
			.set(server)
			.where(eq(serversTable.id, server.id));
	},
};
