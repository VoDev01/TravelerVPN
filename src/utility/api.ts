import Constants from "expo-constants";
import i18n from "i18next";
import Toast from "react-native-toast-message";

const baseUrl =
	Constants.expoConfig?.extra?.backendBaseUrl || "https://traveler-vpn.com";

type BodyParams = Record<string, any>;

const errorToastText = {
	text1: i18n.t("toast_servers_error_text1"),
	text2: i18n.t("toast_servers_error_text2"),
};

i18n.on("languageChanged", (lng) => {
	errorToastText.text1 = i18n.t("toast_servers_error_text1");
	errorToastText.text2 = i18n.t("toast_servers_error_text2");
});

const makeRequest = async (
	url: string,
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
	data?: BodyParams,
	headers?: HeadersInit,
) => {
	try {
		const urlEncoded = new URLSearchParams(data);

		const queryString = urlEncoded.toString();
		const getUrl = queryString
			? `${baseUrl}${url}${url.includes("?") ? "&" : "?"}${queryString}`
			: `${baseUrl}${url}`;

		const options = {
			method,
			headers: {
				Accept: "application/json",
				...headers,
			},
			body: method === "GET" ? undefined : urlEncoded,
		};

		const response = await fetch(getUrl, options);
		const json = await response.json();
		return json;
	} catch (error) {
		Toast.show({
			type: "error",
			text1: errorToastText.text1,
			text2: errorToastText.text2,
		});
		console.error("Error making request to a backend server:", error);
	}
};

export default makeRequest;
