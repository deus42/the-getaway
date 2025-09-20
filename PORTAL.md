# Context Portal (ConPort) Workflow

The manual `yarn portal:build` step has been migrated to the official
[Context Portal MCP (ConPort)](https://github.com/GreatScottyMac/context-portal)
server. ConPort manages the project memory in a SQLite database with
built-in semantic search and MCP tools.

## Prerequisites
- Python 3.10+.
- [`uv`](https://github.com/astral-sh/uv) (recommended) so we can run ConPort with `uvx`.
- Internet access on the first run so SentenceTransformer models can be downloaded.
- Optional: set `CONPORT_LOG_LEVEL=INFO` etc. for verbose logging.

> Legacy Node/Yarn scripts remain for reference but are no longer required once ConPort is in use.

## Project Context Source
Structured markdown lives under `memory-bank/conport_export/` and mirrors the
ConPort export format (`product_context.md`, `progress_log.md`, etc.). Update
those files whenever you change the narrative or architecture docs.

## Import Context into ConPort
Run the helper script from the repository root. It wipes the existing
`context_portal/` directory when `--reset` is supplied.

```bash
uvx --from context-portal-mcp python scripts/conport_import.py \
  --workspace "$(pwd)" \
  --input memory-bank/conport_export \
  --reset
```

The script prints a JSON summary (files processed, items logged, errors).
The database and Alembic metadata live under `context_portal/context.db`.

## Running the ConPort MCP server
Start the server in STDIO (good for IDE MCP clients) or HTTP mode as needed:

```bash
# STDIO (eg. for Cursor/Windsurf/Roo clients)
uvx --from context-portal-mcp conport-mcp --mode stdio --workspace_id "$(pwd)"

# HTTP (listens on :8000 by default)
uvx --from context-portal-mcp conport-mcp --mode http --workspace_id "$(pwd)" --host 127.0.0.1 --port 8000
```

Point your MCP-enabled tool at the running server. ConPort exposes tools such
as `search_product_context`, `log_progress`, `export_conport_to_markdown`, and
`import_markdown_to_conport`.

## Updating Context
1. Edit the markdown under `memory-bank/conport_export/` (or the underlying
   docs referenced in `custom_data` JSON blocks).
2. Re-run the import command above.
3. Restart any MCP clients if they cache context.

You can export the live database back to markdown at any time:

```bash
uvx --from context-portal-mcp python - <<'PY'
from context_portal_mcp.handlers import mcp_handlers
from context_portal_mcp.db import models
from pathlib import Path
workspace = str(Path('.').resolve())
summary = mcp_handlers.handle_export_conport_to_markdown(
    models.ExportConportToMarkdownArgs(
        workspace_id=workspace,
        output_path='conport_export_snapshot'
    )
)
print(summary)
PY
```

The export appears under `context_portal/conport_export_snapshot/` and matches
the format expected by the importer.

## Legacy `.portal` Index
The previous Node CLI output in `.portal/` is still gitignored. Once you no
longer depend on those artifacts, you can delete the directory and remove the
old `yarn portal:build` references from any local tooling.
