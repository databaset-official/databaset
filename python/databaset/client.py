from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from databaset.errors import ApiError, DatabasetError

DEFAULT_BASE_URL = "https://api.databaset.com"
API_KEY_PREFIX = "db_"


class DatabasetClient:
  def __init__(
    self,
    api_key: str,
    *,
    base_url: str | None = None,
    timeout: float = 30.0,
  ):
    self.api_key = _assert_api_key(api_key)
    self.base_url = _normalize_base_url(base_url or os.environ.get("DATABASET_API_URL") or DEFAULT_BASE_URL)
    self.timeout = timeout

  def request(
    self,
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
  ) -> dict[str, Any]:
    url = f"{self.base_url}{path}"
    if params:
      filtered = {k: v for k, v in params.items() if v is not None and v != ""}
      if filtered:
        url = f"{url}?{urllib.parse.urlencode(filtered)}"

    data = None
    headers = {
      "Authorization": f"Bearer {self.api_key}",
      "Accept": "application/json",
    }
    if json_body is not None:
      data = json.dumps(json_body).encode("utf-8")
      headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())

    try:
      with urllib.request.urlopen(req, timeout=self.timeout) as res:
        raw = res.read().decode("utf-8")
        if not raw:
          return {}
        return json.loads(raw)
    except urllib.error.HTTPError as e:
      raw = e.read().decode("utf-8", errors="replace")
      body: dict[str, Any] = {}
      if raw:
        try:
          body = json.loads(raw)
        except json.JSONDecodeError:
          body = {"raw": raw}
      message = body.get("error") or body.get("message") or f"HTTP {e.code}"
      raise ApiError(message, status=e.code, code=body.get("code"), body=body) from e
    except urllib.error.URLError as e:
      raise DatabasetError(
        f"Network error — is the API running at {self.base_url}? ({e.reason})"
      ) from e
    except json.JSONDecodeError as e:
      raise DatabasetError("Invalid JSON response from API") from e


def _normalize_base_url(base_url: str) -> str:
  if not base_url or not base_url.strip():
    raise DatabasetError("base_url must be a non-empty string")
  return base_url.rstrip("/")


def _assert_api_key(api_key: str) -> str:
  if not api_key or not str(api_key).strip():
    raise DatabasetError("api_key is required (or set DATABASET_API_KEY)")
  key = str(api_key).strip()
  if not key.startswith(API_KEY_PREFIX):
    raise DatabasetError(f'api_key must start with "{API_KEY_PREFIX}"')
  return key
