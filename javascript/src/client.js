import { DatabasetError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.databaset.com";
const API_KEY_PREFIX = "db_";

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== "string") {
    throw new DatabasetError("baseUrl must be a non-empty string");
  }
  return baseUrl.replace(/\/+$/, "");
}

function assertApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw new DatabasetError("apiKey is required");
  }
  const key = apiKey.trim();
  if (!key.startsWith(API_KEY_PREFIX)) {
    throw new DatabasetError(`apiKey must start with "${API_KEY_PREFIX}"`);
  }
  return key;
}

export class DatabasetClient {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, timeout = 30_000, fetchImpl } = {}) {
    this.apiKey = assertApiKey(apiKey);
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.timeout = timeout;
    this.fetch = fetchImpl ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);
    if (!this.fetch) {
      throw new DatabasetError("fetch is not available — pass fetchImpl or use Node 18+");
    }
  }

  async request(method, path, { body, query } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), this.timeout)
      : null;

    let res;
    try {
      res = await this.fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new DatabasetError(`Request timed out after ${this.timeout}ms`);
      }
      throw new DatabasetError(
        `Network error — is the API running at ${this.baseUrl}? (${err?.message ?? err})`,
      );
    } finally {
      if (timer) clearTimeout(timer);
    }

    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new DatabasetError(`Invalid JSON response (HTTP ${res.status})`, {
          status: res.status,
          body: text,
        });
      }
    }

    if (!res.ok) {
      throw new DatabasetError(data.error ?? data.message ?? `HTTP ${res.status}`, {
        status: res.status,
        code: data.code,
        body: data,
      });
    }

    return data;
  }
}

export { normalizeBaseUrl, assertApiKey, DEFAULT_BASE_URL };
