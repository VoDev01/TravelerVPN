import { showToast } from "./toast";

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASEURL;

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
		showToast(
			"Unable to reach TravelerVPN servers. Check your internet connection.",
		);
		console.error("Error making request to a backend server:", error);
	}
};

export default makeRequest;
