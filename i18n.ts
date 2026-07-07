import * as Localization from "expo-localization";
import i18n from "i18next";
import LocizeBackend from "i18next-locize-backend";
import { initReactI18next } from "react-i18next";

const fallbackResources = {
	en: {
		translation: {
			not_connected: "Not connected",
			choose_server: "Choose server",
			available_servers: "Available servers",
			cancel: "Cancel",
			select: "Select",
			disconnect: "Disconnect",

			settings_title: "Settings",
			section_ui: "UI",
			section_notifications: "Notifications",
			section_privacy: "Privacy",
			section_language: "Language",

			choose_language: "Choose Language",
			show_connection_speed: "Show connection speed",
			show_region: "Show region",
			show_duration: "Show connection duration",

			connection_alerts: "Connection alerts",
			data_usage_alerts: "Data usage alerts",
			security_warnings: "Security warnings",
			traffic_depletion: "Traffic depletion",
			speed_drop: "Speed drop",

			kill_switch: "Kill switch",
			server_hopping: "Server hopping",
			every: "Every",
			minutes: "minutes",
		},
	},
	ru: {
		translation: {
			not_connected: "Не подключено",
			choose_server: "Список серверов",
			available_servers: "Доступные сервера",
			cancel: "Отмена",
			select: "Выбрать",
			disconnect: "Отключиться",

			settings_title: "Настройки",
			section_ui: "UI",
			section_notifications: "Оповещения",
			section_privacy: "Приватность",
			section_language: "Язык",

			choose_language: "Локализация",
			show_connection_speed: "Показывать скорость соединения",
			show_region: "Показывать регион",
			show_duration: "Показывать длит-ость соединения",

			connection_alerts: "Оповещения о подключении",
			data_usage_alerts: "Предупреждения о трафике",
			security_warnings: "Уведомления безопасности",
			traffic_depletion: "Истощение трафика",
			speed_drop: "Падение скорости",

			kill_switch: "Kill switch",
			server_hopping: "Смена серверов",
			every: "Каждые",
			minutes: "минут",
		},
	},
};

const locales = Localization.getLocales();
const deviceLanguage =
	locales && locales.length > 0 ? locales[0].languageCode : "en";

const locizeOptions = {
	projectId: process.env.EXPO_PUBLIC_LOCIZE_PROJECT_ID,
	apiKey: __DEV__ ? process.env.EXPO_PUBLIC_LOCIZE_API_KEY : undefined,
	referenceLng: "en",
	version: "latest",
};

i18n
	.use(LocizeBackend)
	.use(initReactI18next)
	.init({
		lng: deviceLanguage || "en",
		fallbackLng: "en",
		resources: fallbackResources,
		saveMissing: __DEV__,
		backend: locizeOptions,
		interpolation: {
			escapeValue: false,
		},
		react: {
			useSuspense: false,
		},
	});

export default i18n;
