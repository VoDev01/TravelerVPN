import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { serversTable } from "./schema/servers";

export const expoDb = SQLite.openDatabaseSync("travelervpn.db", {
	enableChangeListener: true,
});

export const db = drizzle(expoDb);

export const seedDatabase = async () => {
	try {
		const existingServers = await db.select().from(serversTable);

		if (existingServers.length === 0) {
			console.log("Db is empty. Seeding...");

			console.log("Data seeded!");
		}
	} catch (error) {
		console.error("Error while trying to seed db:", error);
	}
};
