import type { CalculationResponse, HistoryItem, QuantityDTO } from "../types";
import { API_BASE_URL } from "../config";
import { getToken } from "./auth";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export const measurementConfig = {
  length: {
    measurementType: "LengthUnit",
    units: [
      { label: "Feet", value: "FEET" },
      { label: "Inches", value: "INCHES" },
      { label: "Yards", value: "YARDS" },
      { label: "Centimeters", value: "CENTIMETERS" }
    ]
  },
  weight: {
    measurementType: "WeightUnit",
    units: [
      { label: "Kilogram", value: "KILOGRAM" },
      { label: "Gram", value: "GRAM" },
      { label: "Pound", value: "POUND" }
    ]
  },
  temperature: {
    measurementType: "TemperatureUnit",
    units: [
      { label: "Celsius", value: "CELSIUS" },
      { label: "Fahrenheit", value: "FAHRENHEIT" },
      { label: "Kelvin", value: "KELVIN" }
    ]
  },
  volume: {
    measurementType: "VolumeUnit",
    units: [
      { label: "Litre", value: "LITRE" },
      { label: "Millilitre", value: "MILLILITRE" },
      { label: "Gallon", value: "GALLON" }
    ]
  }
} as const;

export type MeasurementTypeKey = keyof typeof measurementConfig;
export type ActionKey = "comparison" | "conversion" | "arithmetic";

export async function submitCalculation(endpoint: string, payload: { thisQuantityDTO: QuantityDTO; thatQuantityDTO: QuantityDTO }) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.errorMessage || `Request failed with status ${response.status}`);
  }

  return data as CalculationResponse;
}

export async function fetchHistory(endpoint: string) {
  const token = getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(buildUrl(endpoint), {
    headers,
    credentials: "include"
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error((data && (data.message || data.errorMessage)) || "Unable to load history.");
  }

  return data as HistoryItem[];
}

async function requestWithAuth(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include"
  });
}

async function runDeleteCandidates(
  candidates: Array<{ path: string; method?: "DELETE" | "POST"; body?: object }>
) {
  let lastErrorMessage = "Unable to update history.";

  for (const candidate of candidates) {
    const response = await requestWithAuth(candidate.path, {
      method: candidate.method ?? "DELETE",
      body: candidate.body ? JSON.stringify(candidate.body) : undefined
    });

    if (response.ok) {
      return;
    }

    const data = await response.json().catch(() => ({}));
    lastErrorMessage = (data && (data.message || data.errorMessage)) || lastErrorMessage;

    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  throw new Error(lastErrorMessage);
}

export async function clearAllHistory() {
  const response = await requestWithAuth("/api/v1/quantities/my/history", {
    method: "DELETE"
  });

  if (response.ok) {
    return;
  }

  const data = await response.json().catch(() => ({}));
  throw new Error((data && (data.message || data.errorMessage)) || "Unable to clear history.");
}

export async function deleteHistoryItem(historyId: number | string) {
  const response = await requestWithAuth(`/api/v1/quantities/my/history/${historyId}`, {
    method: "DELETE"
  });

  if (response.ok) {
    return;
  }

  const data = await response.json().catch(() => ({}));
  throw new Error((data && (data.message || data.errorMessage)) || "Unable to remove history item.");
}
