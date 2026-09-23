import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const baseUrl =
	Constants.expoConfig?.extra?.backendBaseUrl || "https://traveler-vpn.com";

type BodyParams = Record<string, any>;

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
			text1: "Unable to reach TravelerVPN servers",
			text2: "Check your internet connection or report this issue.",
		});
		console.error("Error making request to a backend server:", error);
	}
};

export default makeRequest;
