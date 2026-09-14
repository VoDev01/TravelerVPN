const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASEURL;

type BodyParams = Record<string, any>;

const makeRequest = async (
	url: string,
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
	data?: BodyParams,
	headers: HeadersInit = {
		Accept: "application/json",
	},
) => {
	try {
		const urlEncoded = new URLSearchParams(method === "GET" ? data : undefined);

		if (data) {
			Object.entries(data).forEach(([k, v]) => {
				if (v !== undefined && v !== null) {
					urlEncoded.append(k, v.toString());
				}
			});
		}

		const getUrl = baseUrl + url + `?${urlEncoded}`;

		const options: RequestInit = {
			method,
			headers:
				method === "GET"
					? headers
					: {
							...headers,
							"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
						},
			body: method === "GET" ? undefined : urlEncoded,
		};

		const response = await fetch(
			method === "GET" ? getUrl : baseUrl + url,
			options,
		);
		const json = await response.json();
		return json;
	} catch (error) {
		console.error("Error making request:", error);
	}
};

export default makeRequest;
