# Databaset JavaScript SDK

Works in **Node 18+** and **browsers**.

Default API: **`https://api.databaset.com`**

## Node / bundlers

```bash
npm install ./sdks/javascript
```

```javascript
import { Memory } from "@databaset/sdk";

const memory = new Memory({
  apiKey: process.env.DATABASET_API_KEY,
  // baseUrl optional — defaults to https://api.databaset.com
});

await memory.store({ userId: "user_123", text: "Prefers dark mode" });
const context = await memory.recall({ userId: "user_123", query: "editor" });
```

Local backend:

```javascript
const memory = new Memory({
  apiKey: process.env.DATABASET_API_KEY,
  baseUrl: "http://localhost:8085",
});
```

## Browser

```html
<script src="https://api.databaset.com/sdk/databaset.js"></script>
<script>
  const memory = new Databaset.Memory({
    apiKey: "db_...",
    baseUrl: "https://api.databaset.com",
  });
</script>
```

Test page: [https://api.databaset.com/memory-test.html](https://api.databaset.com/memory-test.html)
