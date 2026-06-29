/**
 * Databaset Browser SDK v0.1.0
 * Usage: const memory = new Databaset.Memory({ apiKey: 'db_...', baseUrl: 'https://api.databaset.com' });
 */
(function (global) {
  "use strict";

  const DEFAULT_BASE_URL = "https://api.databaset.com";
  const API_KEY_PREFIX = "db_";

  class DatabasetError extends Error {
    constructor(message, { status, code, body } = {}) {
      super(message);
      this.name = "DatabasetError";
      this.status = status;
      this.code = code;
      this.body = body;
    }
  }

  class ValidationError extends DatabasetError {
    constructor(message) {
      super(message, { code: "validation_error" });
      this.name = "ValidationError";
    }
  }

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

  class DatabasetClient {
    constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, timeout = 30000, fetchImpl } = {}) {
      this.apiKey = assertApiKey(apiKey);
      this.baseUrl = normalizeBaseUrl(baseUrl);
      this.timeout = timeout;
      this.fetch = fetchImpl ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);
      if (!this.fetch) {
        throw new DatabasetError("fetch is not available");
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
      const timer = controller ? setTimeout(() => controller.abort(), this.timeout) : null;

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

  function requireNonEmpty(value, field) {
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new ValidationError(`${field} is required`);
    }
    return String(value).trim();
  }

  function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
  }

  function clampFloat(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  class Memory {
    constructor(options = {}) {
      const apiKey = options.apiKey ?? options.api_key;
      this.defaultAppId = options.appId ?? options.app_id ?? null;
      this.client =
        options.client ??
        new DatabasetClient({
          apiKey,
          baseUrl: options.baseUrl ?? options.base_url,
          timeout: options.timeout,
          fetchImpl: options.fetch,
        });
    }

    async store({ userId, text, appId, metadata } = {}) {
      const uid = requireNonEmpty(userId, "userId");
      const content = requireNonEmpty(text, "text");
      const body = { userId: uid, text: content };
      const resolvedAppId = appId ?? this.defaultAppId;
      if (resolvedAppId) body.appId = resolvedAppId;
      if (metadata !== undefined && metadata !== null) {
        if (typeof metadata !== "object" || Array.isArray(metadata)) {
          throw new ValidationError("metadata must be a plain object");
        }
        body.metadata = metadata;
      }
      return this.client.request("POST", "/v1/memories", { body });
    }

    async recall({ userId, query, appId, limit, minScore, format = "string" } = {}) {
      const uid = requireNonEmpty(userId, "userId");
      const q = requireNonEmpty(query, "query");
      const result = await this.client.request("GET", "/v1/memories/recall", {
        query: {
          userId: uid,
          query: q,
          appId: appId ?? this.defaultAppId ?? undefined,
          limit: clampInt(limit, 1, 100, 5),
          minScore: clampFloat(minScore, 0, 1, 0.7),
          format,
        },
      });
      if (format === "array") return result.memories ?? [];
      return result.context ?? "";
    }

    async recallRaw(options) {
      return this.recall({ ...options, format: "array" });
    }

    async list({ userId, appId, page, pageSize } = {}) {
      const uid = requireNonEmpty(userId, "userId");
      return this.client.request("GET", "/v1/memories", {
        query: {
          userId: uid,
          appId: appId ?? this.defaultAppId ?? undefined,
          page: clampInt(page, 0, 10000, 0),
          pageSize: clampInt(pageSize, 1, 100, 20),
        },
      });
    }

    async forget(id) {
      requireNonEmpty(id, "id");
      return this.client.request("DELETE", `/v1/memories/${encodeURIComponent(String(id).trim())}`);
    }

    async forgetUser({ userId, appId } = {}) {
      const uid = requireNonEmpty(userId, "userId");
      return this.client.request("DELETE", "/v1/memories", {
        query: { userId: uid, appId: appId ?? this.defaultAppId ?? undefined },
      });
    }
  }

  global.Databaset = {
    Memory,
    DatabasetClient,
    DatabasetError,
    ValidationError,
    DEFAULT_BASE_URL,
  };
})(typeof window !== "undefined" ? window : globalThis);
