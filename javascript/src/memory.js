import { ValidationError } from "./errors.js";
import { DatabasetClient } from "./client.js";

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

export class Memory {
  constructor(options = {}) {
    const apiKey =
      options.apiKey ??
      options.api_key ??
      (typeof process !== "undefined" ? process.env?.DATABASET_API_KEY : undefined);
    this.defaultAppId = options.appId ?? options.app_id ?? null;
    this.client = options.client ?? new DatabasetClient({
      apiKey,
      baseUrl:
        options.baseUrl ??
        options.base_url ??
        (typeof process !== "undefined" ? process.env?.DATABASET_API_URL : undefined),
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
    if (format === "array") {
      return result.memories ?? [];
    }
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
        page: clampInt(page, 0, 10_000, 0),
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

  async forgetBulk(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError("ids must be a non-empty array");
    }
    return this.client.request("DELETE", "/v1/memories/bulk", {
      body: { ids: ids.map((id) => String(id).trim()) },
    });
  }
}
