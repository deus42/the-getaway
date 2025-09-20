#!/usr/bin/env python3
"""Helper script to load markdown context into ConPort.

This script relies on the `context-portal-mcp` package. Run it via
`uvx --from context-portal-mcp python scripts/conport_import.py`.
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from context_portal_mcp.handlers import mcp_handlers
from context_portal_mcp.db import models
from context_portal_mcp.core import config as conport_config


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Import markdown context into ConPort")
  parser.add_argument(
      "--workspace",
      default=".",
      help="Workspace root passed to ConPort (default: current directory)",
  )
  parser.add_argument(
      "--input",
      default="memory-bank/conport_export",
      help="Path (relative to workspace) containing markdown export to import",
  )
  parser.add_argument(
      "--db-file",
      default=None,
      help="Optional custom database filename (stored under workspace/context_portal)",
  )
  parser.add_argument(
      "--db-dir",
      default=None,
      help="Optional custom base directory for databases (absolute path)",
  )
  parser.add_argument(
      "--reset",
      action="store_true",
      help="Delete any existing context_portal database before importing",
  )
  return parser.parse_args()


def main() -> None:
  args = parse_args()
  workspace_path = Path(args.workspace).resolve()
  if not workspace_path.exists():
    raise SystemExit(f"Workspace does not exist: {workspace_path}")

  if args.db_dir:
    conport_config.set_base_path(args.db_dir)
  if args.db_file:
    conport_config.set_db_filename(args.db_file)

  if args.reset and args.db_dir:
    # When using a base dir, wipe its specific workspace folder
    sanitized_id = str(workspace_path).replace('/', '_').replace('\\', '_')
    db_root = Path(args.db_dir).expanduser() / sanitized_id
    if db_root.exists():
      shutil.rmtree(db_root)
  elif args.reset:
    default_dir = workspace_path / "context_portal"
    if default_dir.exists():
      shutil.rmtree(default_dir)

  import_args = models.ImportMarkdownToConportArgs(
      workspace_id=str(workspace_path),
      input_path=args.input,
  )
  summary = mcp_handlers.handle_import_markdown_to_conport(import_args)
  print(json.dumps(summary, indent=2))


if __name__ == "__main__":
  main()
