#!/usr/bin/env python3
"""Quick SDK smoke test: DATABASET_API_KEY=db_... python examples/smoke_test.py"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from databaset import Memory, DatabasetError


def main() -> None:
  api_key = os.environ.get("DATABASET_API_KEY")
  base_url = os.environ.get("DATABASET_API_URL", "https://api.databaset.com")
  user_id = os.environ.get("DATABASET_TEST_USER", "user_123")

  if not api_key:
    print("Set DATABASET_API_KEY=db_...")
    sys.exit(1)

  memory = Memory(api_key=api_key, base_url=base_url)

  try:
    stored = memory.store(
      user_id,
      "SDK smoke test: user prefers dark mode",
      metadata={"source": "python-sdk"},
    )
    print("store:", stored)

    context = memory.recall(user_id, "dark mode")
    print("recall:", context[:200] if context else "(empty)")

    listed = memory.list(user_id)
    print("list total:", listed.get("total"))
  except DatabasetError as e:
    print("error:", e)
    if e.body:
      print("body:", e.body)
    sys.exit(1)


if __name__ == "__main__":
  main()
