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
			no_available_servers: "No available servers found",
			section_subscription_servers: "Subscription servers",
			section_user_servers: "User servers",

			cancel: "Cancel",
			select: "Select",
			connect: "Connect",
			disconnect: "Disconnect",
			save: "Save",

			loader_fonts: "Loading fonts...",
			loader_servers: "Loading servers...",
			loader_map: "Loading map...",
			loader_assets: "Loading 3d assets",

			settings_title: "Settings",
			section_ui: "UI",
			section_notifications: "Notifications",
			section_privacy: "Privacy",
			section_language: "Language",

			theme: "Theme",
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

			subscription_business: "Business class",
			subscription_title: "Choose your plan",
			subscription_subtitle:
				"Keep every location unlocked and renew your access in seconds.",
			plan_monthly: "Monthly",
			plan_quarterly: "3 months",
			plan_yearly: "Yearly",
			plan_per_month: "per month",
			plan_every_three_months: "every 3 months",
			plan_per_year: "per year",
			plan_popular: "Popular",
			plan_best_value: "Best value",
			subscription_benefits:
				"All servers - Unlimited traffic - Priority access",
			continue_to_payment: "Continue to payment",
			payment_placeholder_title: "Payment gateway placeholder",
			payment_placeholder_description:
				"This sheet marks where the app will redirect to a payment provider. Use the simulation button to test the successful-payment callback.",
			simulate_payment_success: "Simulate successful payment",
			subscription_renewed: "Subscription renewed",
			subscription_renewal_failed: "Unable to renew subscription",

			add_servers_title: "Add your own servers",
			add_servers_country_label: "Choose country",
			add_servers_name_label: "Name of your server",
			add_servers_link_label: "Paste connection link",

			toast_subscription_denied_text1: "Denied access to servers",
			toast_subscription_denied_text2:
				"Start using TravelerVPN servers by buying a subcription",

			toast_servers_error_text1: "Service unavailable",
			toast_servers_error_text2:
				"Check your internet connection or report this issue",

			notification_title: "TravelerVPN tunnel",
			notification_content: "Status:",
			notification_connected: "Connected 🛬✅​​",
			notification_waiting: "Waiting... 🛫​​​",
		},
	},
	ru: {
		translation: {
			not_connected: "Не подключено",
			choose_server: "Список серверов",
			available_servers: "Доступные сервера",
			no_available_servers: "Не найдено доступных серверов",
			section_subscription_servers: "Сервера подписки",
			section_user_servers: "Сервера пользователя",

			cancel: "Отмена",
			select: "Выбрать",
			connect: "Подключится",
			disconnect: "Отключиться",
			save: "Сохранить",

			loader_fonts: "Загрузка шрифтов...",
			loader_servers: "Загрузка серверов...",
			loader_map: "Загрузка карты...",
			loader_assets: "Загрузка 3д ассетов...",

			settings_title: "Настройки",
			section_ui: "UI",
			section_notifications: "Оповещения",
			section_privacy: "Приватность",
			section_language: "Язык",

			theme: "Тема",
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

			subscription_business: "Бизнесс класс",
			subscription_title: "Выберите тариф",
			subscription_subtitle:
				"Откройте все локации и продлите доступ за несколько секунд.",
			plan_monthly: "Месяц",
			plan_quarterly: "3 месяца",
			plan_yearly: "Год",
			plan_per_month: "в месяц",
			plan_every_three_months: "каждые 3 месяца",
			plan_per_year: "в год",
			plan_popular: "Популярный",
			plan_best_value: "Выгодно",
			subscription_benefits:
				"Все серверы - Безлимитный трафик - Приоритетный доступ",
			continue_to_payment: "Перейти к оплате",
			payment_placeholder_title: "Заглушка платежного шлюза",
			payment_placeholder_description:
				"Здесь приложение будет перенаправлять пользователя в платежный сервис. Кнопка симуляции проверяет успешное завершение оплаты.",
			simulate_payment_success: "Симулировать успешную оплату",
			subscription_renewed: "Подписка продлена",
			subscription_renewal_failed: "Не удалось продлить подписку",

			add_servers_title: "Добавить сервер",
			add_servers_country_label: "Выберите страну",
			add_servers_name_label: "Название сервера",
			add_servers_link_label: "Вставьте строку подключения",

			toast_subscription_denied_text1: "Сервера недоступны",
			toast_subscription_denied_text2:
				"Начните использовать сервера TravelerVPN, купив подписку",

			toast_servers_error_text1: "Сервис недоступен",
			toast_servers_error_text2:
				"Проверьте интернет-соединение или сообщите об этой проблеме",

			notification_title: "TravelerVPN туннель",
			notification_content: "Статус:",
			notification_connected: "Подключено 🛬✅​​",
			notification_waiting: "Ожидание... 🛫​​​",
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
