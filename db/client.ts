import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { serversTable } from "./schema/servers";

export const expoDb = SQLite.openDatabaseSync("travelervpn.db", {
	enableChangeListener: true,
});

export const db = drizzle(expoDb);

export const seedDatabase = async () => {
	try {
		// Проверяем, есть ли уже данные, чтобы не дублировать их при каждом перезапуске
		const existingServers = await db.select().from(serversTable).limit(1);

		if (existingServers.length === 0) {
			console.log(
				"База данных пуста. Начинаем наполнение дефолтными серверами...",
			);

			await db.insert(serversTable).values([
				{
					locationCity: "New York",
					locationCountry: "USA",
					ipv4: "192.168.1.1",
					ipv6: "2001:db8::1",
				},
				{
					locationCity: "Frankfurt",
					locationCountry: "Germany",
					ipv4: "192.168.1.2",
					ipv6: "2001:db8::2",
				},
			]);

			console.log("Данные успешно добавлены!");
		}
	} catch (error) {
		console.error("Ошибка при сиде базы данных:", error);
	}
};
