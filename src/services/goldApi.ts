// src/api/goldApi.ts
import { GoldPurchase } from "@/types/gold";

/** ========= Auth Token Wiring (no hooks here) =========
 * In your app bootstrap (e.g., after react-oidc-context loads the user),
 * call setAccessTokenGetter(() => auth.user?.access_token ?? null)
 */
let accessTokenGetter: (() => string | null | Promise<string | null>) | null = null;
export const setAccessTokenGetter = (getter: () => string | null | Promise<string | null>) => {
	accessTokenGetter = getter;
};

async function getAccessToken(): Promise<string | null> {
	if (!accessTokenGetter) return null;
	const t = accessTokenGetter();
	return t instanceof Promise ? await t : t;
}

// Optional: allow the app to react to 401s (e.g., redirect to login)
let onAuthError: (() => void) | null = null;
export const setOnAuthError = (cb: () => void) => {
	onAuthError = cb;
};

/** ========= Config ========= */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string; // e.g. https://nas.example.com/api
const GOLD_PRICE_API = "https://api.metals.live/v1/spot/gold"; // public fallback

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/** ========= Fetch helper with token + 401 handling ========= */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
	try {
		const token = await getAccessToken();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...(init?.headers as Record<string, string> | undefined),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};

		const res = await fetch(path.startsWith("http") ? path : `${API_BASE_URL}${path}`, {
			...init,
			headers,
		});

		if (res.status === 401 && onAuthError) {
			onAuthError();
		}

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
		}

		// Some endpoints (DELETE) may return no body
		const contentType = res.headers.get("content-type") ?? "";
		const data = contentType.includes("application/json") ? await res.json() : undefined;
		return { success: true, data };
	} catch (error) {
		console.warn("API error:", error);
		return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
	}
}

/** ========= Gold Purchase CRUD (no more userId in client) =========
 * Backend must derive the user from the JWT (issuer: Authentik) and ignore any client-sent userId.
 */
export const goldPurchaseApi = {
	// Get all purchases for the authenticated user
	getAll: async (): Promise<ApiResponse<GoldPurchase[]>> => {
		return apiFetch<GoldPurchase[]>("/gold-purchases", { method: "GET" });
	},

	// Create new purchase
	create: async (
		purchase: Omit<GoldPurchase, "id" | "userId">
	): Promise<ApiResponse<GoldPurchase>> => {
		return apiFetch<GoldPurchase>("/gold-purchases", {
			method: "POST",
			body: JSON.stringify(purchase),
		});
	},

	// Update purchase
	update: async (
		id: string,
		purchase: Partial<Omit<GoldPurchase, "id" | "userId">>
	): Promise<ApiResponse<GoldPurchase>> => {
		return apiFetch<GoldPurchase>(`/gold-purchases/${id}`, {
			method: "PUT",
			body: JSON.stringify(purchase),
		});
	},

	// Delete purchase
	delete: async (id: string): Promise<ApiResponse<void>> => {
		return apiFetch<void>(`/gold-purchases/${id}`, { method: "DELETE" });
	},
};

/** ========= Gold Price API =========
 * Tries your backend first (authenticated), then public fallback.
 */
export const goldPriceApi = {
	getCurrentPrice: async (): Promise<ApiResponse<number>> => {
		// Try your backend first
		const primary = await apiFetch<{ pricePerGram: number }>("/gold-price", { method: "GET" });
		if (primary.success && typeof primary.data?.pricePerGram === "number") {
			return { success: true, data: primary.data.pricePerGram };
		}

		// Public fallback (metals.live returns an array like: [[price, timestamp], ...] or [price] variants)
		try {
			const res = await fetch(GOLD_PRICE_API, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const payload = await res.json();

			// Normalize common shapes:
			// 1) [number, number, ...]  -> take first number
			// 2) [[number, ...], ...]   -> take first[0]
			// 3) { price: number }      -> price
			let perOunce: number | undefined;
			if (Array.isArray(payload)) {
				if (payload.length && Array.isArray(payload[0])) perOunce = Number(payload[0][0]);
				else perOunce = Number(payload[0]);
			} else if (payload && typeof payload.price === "number") {
				perOunce = payload.price;
			}

			if (!perOunce || Number.isNaN(perOunce))
				throw new Error("Unexpected gold price payload");

			const pricePerGram = perOunce / 31.1035;
			return { success: true, data: pricePerGram };
		} catch (error) {
			console.warn("Gold price fallback failed:", error);
			return { success: false, error: "Failed to fetch gold price" };
		}
	},

	getHistoricalPrice: async (daysBack: number): Promise<ApiResponse<number>> => {
		try {
			const targetDate = new Date();
			targetDate.setDate(targetDate.getDate() - daysBack);
			const dateStr = targetDate.toISOString().split("T")[0];

			const r = await apiFetch<{ pricePerGram: number }>(
				`/gold-price/historical?date=${dateStr}`,
				{ method: "GET" }
			);
			if (r.success && typeof r.data?.pricePerGram === "number")
				return { success: true, data: r.data.pricePerGram };

			// No public historical fallback wired here
			return { success: false, error: "Historical price API not available" };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},

	getPriceAtDate: async (date: string): Promise<ApiResponse<number>> => {
		const r = await apiFetch<{ pricePerGram: number }>(`/gold-price/historical?date=${date}`, {
			method: "GET",
		});
		if (r.success && typeof r.data?.pricePerGram === "number")
			return { success: true, data: r.data.pricePerGram };
		return { success: false, error: "Historical price API not available" };
	},
};

/** ========= Settings API ========= */
export const settingsApi = {
	get: async (): Promise<ApiResponse<{ currency: string; autoFetchPrice: boolean }>> => {
		return apiFetch<{ currency: string; autoFetchPrice: boolean }>("/settings", {
			method: "GET",
		});
	},

	update: async (settings: {
		currency?: string;
		autoFetchPrice?: boolean;
	}): Promise<ApiResponse<void>> => {
		return apiFetch<void>("/settings", {
			method: "PUT",
			body: JSON.stringify(settings),
		});
	},
};
