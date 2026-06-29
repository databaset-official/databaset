#!/usr/bin/env node
/**
 * Node SDK smoke test (local src/)
 *
 *   DATABASET_API_KEY=db_xxx node examples/smoke.mjs
 *   DATABASET_API_URL=http://localhost:8085 node examples/smoke.mjs
 */

import { Memory, DatabasetError } from "../src/index.js";

const apiKey = process.env.DATABASET_API_KEY?.trim();
const baseUrl = (process.env.DATABASET_API_URL ?? "https://api.databaset.com").replace(/\/$/, "");
const userId = process.env.DATABASET_TEST_USER ?? "sdk_test_user";

if (!apiKey) {
  console.error("✗ Set DATABASET_API_KEY=db_... (no space after =)");
  process.exit(1);
}

const memory = new Memory({ apiKey, baseUrl });

console.log(`API: ${baseUrl} | user: ${userId}\n`);

try {
  for (const [label, fn] of [
    ["store", () => memory.store({
      userId,
      text: "Node SDK test: user prefers dark mode and VS Code",
      metadata: { source: "node-sdk-smoke" },
    })],
    ["recall", async () => {
      const context = await memory.recall({
        userId,
        query: "what editor does the user use",
        limit: 5,
        minScore: 0.35,
      });
      return { chars: context?.length ?? 0, preview: context?.slice(0, 100) };
    }],
    ["recallRaw", async () => {
      const hits = await memory.recallRaw({ userId, query: "dark mode", limit: 3, minScore: 0.35 });
      return { count: hits.length, scores: hits.map((h) => h.score) };
    }],
    ["list", () => memory.list({ userId, page: 0, pageSize: 5 })],
  ]) {
    process.stdout.write(`→ ${label}… `);
    const result = await fn();
    console.log("OK");
    console.log(" ", JSON.stringify(result));
  }
  console.log("\n✓ Node SDK smoke test passed");
} catch (err) {
  if (err instanceof DatabasetError) {
    console.error("✗", err.message, err.status ? `(HTTP ${err.status})` : "", err.body ?? "");
  } else {
    console.error("✗", err);
  }
  process.exit(1);
}
