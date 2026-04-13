export const TOKEN_KEY = "qm_access_token";
export const USER_KEY = "qm_user";

function envFlag(name: string, defaultValue: boolean) {
	const value = import.meta.env[name];

	if (value === undefined || value === "") {
		return defaultValue;
	}

	return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

// Use same-origin API paths by default so deployed frontend can use Nginx proxy routes
// and avoid browser CORS/Origin rejections that do not occur in Postman.
export const API_BASE_URL = envFlag("VITE_PREFER_SAME_ORIGIN_API", true) ? "" : rawApiBaseUrl;
