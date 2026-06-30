<p align="center">
  <strong>Databaset</strong><br />
  AI Memory API for long-term LLM memory
</p>

<p align="center">
  <a href="https://databaset.com">Website</a> ·
  <a href="https://docs.databaset.com">Docs</a> ·
  <a href="https://app.databaset.com/signup">Start Free</a> ·
  <a href="https://www.npmjs.com/package/@databaset/sdk">npm</a> ·
  <a href="https://pypi.org/project/databaset/">PyPI</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@databaset/sdk"><img src="https://img.shields.io/npm/v/@databaset/sdk?label=npm&color=orange" alt="npm version" /></a>
  <a href="https://pypi.org/project/databaset/"><img src="https://img.shields.io/pypi/v/databaset?label=pypi&color=orange" alt="PyPI version" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/API-stable-green.svg" alt="API stable" />
</p>

---

## Your AI forgets everything. Fix it in three lines.

**Databaset** is an AI memory API that gives GPT, Claude, Gemini, and any LLM **persistent, semantic memory** for every user.

Store what a user says once. Recall it by meaning weeks later. Inject the context into your model prompt. No vector database setup. No embedding pipelines. No chunk tuning.

```javascript
await memory.store({ userId, text: "User prefers PostgreSQL and dark mode" })
const context = await memory.recall({ userId, query: userMessage })
// inject `context` into your LLM system prompt
```

That is the entire integration loop.

---

## Why Databaset?

Every AI app hits the same wall:

1. Build a chatbot
2. Users love it
3. The AI forgets everything on the next session
4. You add Pinecone, embeddings, chunking, retrieval, and ranking
5. You rebuild the same infra on every new project

Databaset replaces that stack with **one API** and **one dashboard**.

| Without Databaset | With Databaset |
|---|---|
| Learn embeddings | One SDK |
| Configure Pinecone | One API |
| Tune chunk sizes | One dashboard |
| Debug retrieval | Production-ready memory |
| Rebuild every project | Ship in minutes |

---

## What Databaset handles for you

You send text. Databaset does the rest:

- **Chunking** on sentence boundaries
- **Embeddings** with production models
- **Vector storage** (pgvector under the hood)
- **Semantic ranking** and recency boost
- **Metadata** and deduplication
- **Context injection** as a ready-to-use string

You never configure any of it.

---

## Quickstart

### 1. Get an API key

Sign up free at [app.databaset.com](https://app.databaset.com/signup). No credit card required.

Free tier includes **3,000 API calls in your first month** (not monthly after that).

### 2. Install an SDK

**Node.js / TypeScript**

```bash
npm install @databaset/sdk
```

**Python**

```bash
pip install databaset
```

### 3. Store and recall

**JavaScript**

```javascript
import { Memory } from "@databaset/sdk";

const memory = new Memory({
  apiKey: process.env.DATABASET_API_KEY,
});

// Store a memory
await memory.store({
  userId: "user_123",
  text: "User prefers PostgreSQL and dark mode",
  metadata: { source: "onboarding" },
});

// Recall relevant context
const context = await memory.recall({
  userId: "user_123",
  query: "What stack should I use?",
  limit: 5,
});

console.log(context);
// "User prefers PostgreSQL and dark mode"
```

**Python**

```python
import os
from databaset import Memory

memory = Memory(api_key=os.environ["DATABASET_API_KEY"])

memory.store(
    "user_123",
    "User prefers PostgreSQL and dark mode",
    metadata={"source": "onboarding"},
)

context = memory.recall("user_123", "What stack should I use?")
print(context)
```

### 4. Inject into any LLM

**OpenAI**

```javascript
import OpenAI from "openai";

const openai = new OpenAI();
const context = await memory.recall({ userId, query: message });

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: context ? `User context: ${context}` : "You are a helpful assistant." },
    { role: "user", content: message },
  ],
});
```

**Claude (Anthropic)**

```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const context = await memory.recall({ userId, query: message });

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: context ? `User context: ${context}` : "You are a helpful assistant.",
  messages: [{ role: "user", content: message }],
});
```

Works with **LangChain**, **Vercel AI SDK**, **Gemini**, **Llama**, and any model that accepts a system prompt.

---

## Real-world example

```
User:     "I use PostgreSQL and prefer dark mode."
          ↓
Databaset stores the memory with semantic indexing
          ↓
One week later
          ↓
User:     "What stack should I use?"
          ↓
AI:       "Since you prefer PostgreSQL and dark mode, here is what I would recommend..."
```

Memory that actually sticks across sessions.

---

## SDK reference

Both SDKs talk to the same REST API at `https://api.databaset.com`.

| Method | Description |
|---|---|
| `store` | Save text as a memory for a user |
| `recall` | Semantic search, returns context string |
| `recallRaw` / `recall_raw` | Returns array of matches with scores |
| `list` | Paginated list of memories for a user |
| `forget` | Delete a memory by ID |
| `forgetUser` / `forget_user` | Delete all memories for a user |

**Environment variables**

| Variable | Description |
|---|---|
| `DATABASET_API_KEY` | Your API key (`db_...`) |
| `DATABASET_API_URL` | Optional. Defaults to `https://api.databaset.com` |

**Browser usage**

```html
<script src="https://api.databaset.com/sdk/databaset.js"></script>
<script>
  const memory = new Databaset.Memory({
    apiKey: "db_your_key",
    baseUrl: "https://api.databaset.com",
  });
</script>
```

Live browser test: [api.databaset.com/memory-test.html](https://api.databaset.com/memory-test.html)

---

## Use cases

Databaset powers memory for:

- Customer support AI
- Personal AI assistants
- Coding agents
- CRM and sales copilots
- Healthcare assistants
- Education apps
- Email assistants
- Internal company AI
- Knowledge bots
- Second brain apps

One API key. Unlimited users. Each user's memories are fully isolated by `userId`.

---

## Platform

| | |
|---|---|
| **Store** | Conversations, preferences, documents, notes, events |
| **Recall** | Find memories by meaning, not keywords |
| **Inject** | Ready-to-use context for any LLM |
| **Observe** | Dashboard to see, search, and delete every memory |

Dashboard: [app.databaset.com](https://app.databaset.com)

---

## REST API

Prefer raw HTTP? Full OpenAPI docs at [docs.databaset.com](https://docs.databaset.com).

```bash
# Store a memory
curl -X POST https://api.databaset.com/v1/memories \
  -H "Authorization: Bearer db_your_key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","text":"Prefers dark mode"}'

# Recall context
curl "https://api.databaset.com/v1/memories/recall?userId=user_123&query=preferences" \
  -H "Authorization: Bearer db_your_key"
```

---

## Pricing

| Plan | Price | Highlights |
|---|---|---|
| **Free** | $0 | 3,000 API calls in month 1, 1 app, full API |
| **Starter** | $29/mo | ≈ 100k users worth of storage, 10 apps |
| **Growth** | $99/mo | ≈ 1M users worth of storage, priority support |
| **Enterprise** | Custom | Self-host option, SLA, dedicated support |

Details: [databaset.com/pricing](https://databaset.com/pricing)

---

## Security

- TLS 1.3 in transit
- AES-256 encryption at rest
- API keys stored as hashes, never plain text
- Per-user memory isolation by `userId`
- Your data is never used to train models

---

## Repository structure

This repo contains the official open-source SDKs:

```
sdks/
├── javascript/     @databaset/sdk  (Node.js + browser)
└── python/         databaset       (PyPI)
```

The hosted API, dashboard, and marketing site are maintained separately.

---

## Local development (SDKs)

**JavaScript**

```bash
cd sdks/javascript
npm install
npm test
```

**Python**

```bash
cd sdks/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

Point at a local backend with `DATABASET_API_URL=http://localhost:8085`.

---

## Links

| | |
|---|---|
| Website | [databaset.com](https://databaset.com) |
| Documentation | [docs.databaset.com](https://docs.databaset.com) |
| Dashboard | [app.databaset.com](https://app.databaset.com) |
| API | [api.databaset.com](https://api.databaset.com) |
| Changelog | [databaset.com/changelog](https://databaset.com/changelog) |
| X / Twitter | [@Data_bataset](https://x.com/Data_bataset) |
| GitHub | [github.com/databaset-official/databaset](https://github.com/databaset-official/databaset) |
| Support | [app@databaset.com](mailto:app@databaset.com) |

---

## Contributing

Issues and pull requests are welcome on the SDKs.

1. Fork the repo
2. Create a feature branch
3. Add tests for any behavior change
4. Open a PR with a clear description

---

## License

SDKs in `sdks/` are released under the **MIT License**.

The hosted Databaset API at api.databaset.com is a separate commercial service.

---

<p align="center">
  <sub>Built for developers who are tired of rebuilding memory infra on every project.</sub>
</p>
