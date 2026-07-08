import { db } from "../client";
import { ServerDAO } from "../dao/ServerDAO";
import { NewServer, ServerEntity, serversTable } from "../schema/servers";

export const ServerRepository = {
	getServersQuery() {
		return db.select().from(serversTable);
	},

	async getAll() {
		return await ServerDAO.getAll();
	},

	async getById(id: number) {
		return await ServerDAO.getById(id);
	},

	async add(server: NewServer) {
		await ServerDAO.add(server);
	},

	async delete(server: ServerEntity) {
		await ServerDAO.delete(server);
	},

	async update(server: ServerEntity) {
		await ServerDAO.update(server);
	},
};
