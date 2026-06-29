# Databaset SDKs

Official client libraries for the Memory API (`/v1/memories`).

**Production API:** `https://api.databaset.com`

| SDK | Path | Install |
|-----|------|---------|
| JavaScript / Node | `sdks/javascript/` | `npm install ./sdks/javascript` |
| Python | `sdks/python/` | `pip install -e ./sdks/python` |

## Browser test

1. Start backend: `cd backend && mvn spring-boot:run`
2. Open `https://api.databaset.com/memory-test.html` (prod) or `http://localhost:8085/memory-test.html` (local)
3. SDK loaded from `https://api.databaset.com/sdk/databaset.js`

## Python smoke test (production)

```bash
export DATABASET_API_KEY=db_your_key
python sdks/python/examples/smoke_test.py
```

Local backend:

```bash
export DATABASET_API_URL=http://localhost:8085
python sdks/python/examples/smoke_test.py
```

## API surface (both SDKs)

- `store` — save memory text + optional metadata
- `recall` — semantic search → context string
- `recallRaw` / `recall_raw` — array of matches with scores
- `list` — paginated memories for a user
- `forget` — delete by memory UUID
- `forgetUser` / `forget_user` — delete all for user

Edge cases handled: missing keys, invalid `db_` prefix, empty fields, network/timeout errors, non-JSON responses, HTTP error bodies.
