# Databaset Python SDK

Default API: **`https://api.databaset.com`**

```bash
pip install -e ./sdks/python
```

```python
import os
from databaset import Memory

memory = Memory(api_key=os.environ["DATABASET_API_KEY"])

memory.store("user_123", "Prefers dark mode", metadata={"source": "api"})
context = memory.recall("user_123", "editor preferences")
print(context)
```

Set `DATABASET_API_KEY=db_...`. Optional `DATABASET_API_URL` (defaults to production).

Local backend:

```python
memory = Memory(
    api_key=os.environ["DATABASET_API_KEY"],
    base_url="http://localhost:8085",
)
```
