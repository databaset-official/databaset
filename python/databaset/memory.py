from __future__ import annotations

import os
from typing import Any

from databaset.client import DatabasetClient
from databaset.errors import ValidationError


def _require(value: Any, field: str) -> str:
  if value is None or str(value).strip() == "":
    raise ValidationError(f"{field} is required")
  return str(value).strip()


def _clamp_int(value: Any, min_v: int, max_v: int, default: int) -> int:
  try:
    n = int(value)
  except (TypeError, ValueError):
    return default
  return max(min_v, min(max_v, n))


def _clamp_float(value: Any, min_v: float, max_v: float, default: float) -> float:
  try:
    n = float(value)
  except (TypeError, ValueError):
    return default
  return max(min_v, min(max_v, n))


class Memory:
  def __init__(
    self,
    api_key: str | None = None,
    *,
    base_url: str | None = None,
    app_id: str | None = None,
    timeout: float = 30.0,
    client: DatabasetClient | None = None,
  ):
    key = api_key or os.environ.get("DATABASET_API_KEY")
    self.default_app_id = app_id
    self.client = client or DatabasetClient(key, base_url=base_url, timeout=timeout)

  def store(
    self,
    user_id: str,
    text: str,
    *,
    app_id: str | None = None,
    metadata: dict[str, Any] | None = None,
  ) -> dict[str, Any]:
    uid = _require(user_id, "user_id")
    content = _require(text, "text")
    body: dict[str, Any] = {"userId": uid, "text": content}
    resolved_app = app_id or self.default_app_id
    if resolved_app:
      body["appId"] = resolved_app
    if metadata is not None:
      if not isinstance(metadata, dict):
        raise ValidationError("metadata must be a dict")
      body["metadata"] = metadata
    return self.client.request("POST", "/v1/memories", json_body=body)

  def recall(
    self,
    user_id: str,
    query: str,
    *,
    app_id: str | None = None,
    limit: int | None = None,
    min_score: float | None = None,
    format: str = "string",
  ) -> str | list[dict[str, Any]]:
    uid = _require(user_id, "user_id")
    q = _require(query, "query")
    result = self.client.request(
      "GET",
      "/v1/memories/recall",
      params={
        "userId": uid,
        "query": q,
        "appId": app_id or self.default_app_id,
        "limit": _clamp_int(limit, 1, 100, 5),
        "minScore": _clamp_float(min_score, 0.0, 1.0, 0.7),
        "format": format,
      },
    )
    if format == "array":
      return result.get("memories") or []
    return result.get("context") or ""

  def recall_raw(self, user_id: str, query: str, **kwargs: Any) -> list[dict[str, Any]]:
    out = self.recall(user_id, query, format="array", **kwargs)
    return out if isinstance(out, list) else []

  def list(
    self,
    user_id: str,
    *,
    app_id: str | None = None,
    page: int | None = None,
    page_size: int | None = None,
  ) -> dict[str, Any]:
    uid = _require(user_id, "user_id")
    return self.client.request(
      "GET",
      "/v1/memories",
      params={
        "userId": uid,
        "appId": app_id or self.default_app_id,
        "page": _clamp_int(page, 0, 10_000, 0),
        "pageSize": _clamp_int(page_size, 1, 100, 20),
      },
    )

  def forget(self, memory_id: str) -> dict[str, Any]:
    mid = _require(memory_id, "memory_id")
    return self.client.request("DELETE", f"/v1/memories/{mid}")

  def forget_user(self, user_id: str, *, app_id: str | None = None) -> dict[str, Any]:
    uid = _require(user_id, "user_id")
    return self.client.request(
      "DELETE",
      "/v1/memories",
      params={"userId": uid, "appId": app_id or self.default_app_id},
    )

  def forget_bulk(self, ids: list[str]) -> dict[str, Any]:
    if not ids:
      raise ValidationError("ids must be a non-empty list")
    return self.client.request(
      "DELETE",
      "/v1/memories/bulk",
      json_body={"ids": [str(i).strip() for i in ids]},
    )
