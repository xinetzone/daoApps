#!/usr/bin/env python3
"""Export OpenAPI schemas from FastAPI applications."""

import io
import json
import sys
from pathlib import Path

# 确保 stdout 支持 UTF-8 输出（Windows GBK 兼容）
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(
        sys.stdout.buffer, encoding="utf-8", errors="replace"
    )

SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"
SCHEMAS_DIR.mkdir(exist_ok=True)

SERVICES = [
    ("config_center", "taolib.config_center.server.app:create_app"),
    ("oauth", "taolib.oauth.server.app:create_app"),
    ("qrcode", "taolib.qrcode.server.app:create_app"),
    ("rate_limiter", "taolib.rate_limiter.api.router:app"),
    ("analytics", "taolib.analytics.server.app:create_app"),
    ("data_sync", "taolib.data_sync.server.app:create_app"),
    ("email_service", "taolib.email_service.server.app:create_app"),
    ("file_storage", "taolib.file_storage.server.app:create_app"),
    ("task_queue", "taolib.task_queue.server.app:create_app"),
]


def import_object(import_path: str):
    """Import an object from a dotted path like 'module:object'."""
    module_path, object_name = import_path.split(":")
    module = __import__(module_path, fromlist=[object_name])
    obj = getattr(module, object_name)
    if callable(obj) and not hasattr(obj, "openapi"):
        obj = obj()
    return obj


def export_schema(name: str, import_path: str) -> bool:
    """Export OpenAPI schema for a service."""
    try:
        app = import_object(import_path)
        if not hasattr(app, "openapi"):
            print(f"  ⚠️  {name}: No OpenAPI schema available")
            return False

        schema = app.openapi()
        output_path = SCHEMAS_DIR / f"{name}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2, ensure_ascii=False)
        print(f"  ✅ {name}: {output_path}")
        return True
    except ImportError as e:
        print(f"  ⚠️  {name}: Import error - {e}")
        return False
    except Exception as e:
        print(f"  ❌ {name}: {e}")
        return False


def main():
    print("Exporting OpenAPI schemas...")
    success_count = 0
    for name, import_path in SERVICES:
        if export_schema(name, import_path):
            success_count += 1
    print(f"\nExported {success_count}/{len(SERVICES)} schemas to {SCHEMAS_DIR}")
    return 0 if success_count > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
