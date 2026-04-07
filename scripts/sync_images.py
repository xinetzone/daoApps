#!/usr/bin/env python3
"""
图片资源同步脚本

将集中管理的 assets/images/<app>/ 下的图片同步到各应用的 public/images/ 目录。
确保 assets/images/ 是图片资源的唯一管理源（Single Source of Truth）。

用法:
    python scripts/sync_images.py          # 同步所有应用
    python scripts/sync_images.py forum    # 只同步指定应用
    python scripts/sync_images.py --check  # 仅检查，不执行同步
"""

import argparse
import shutil
import sys
from pathlib import Path

# 项目根目录
ROOT = Path(__file__).resolve().parent.parent

# 集中图片资源目录
ASSETS_IMAGES = ROOT / "assets" / "images"

# 应用目录
APPS_DIR = ROOT / "apps"

# 应用名 → 其 public/images 目标目录的映射
APP_IMAGE_DIRS: dict[str, Path] = {}


def discover_apps() -> None:
    """扫描 apps/ 目录发现所有应用。"""
    if not APPS_DIR.exists():
        return
    for app_dir in sorted(APPS_DIR.iterdir()):
        if app_dir.is_dir() and (app_dir / "package.json").exists():
            APP_IMAGE_DIRS[app_dir.name] = app_dir / "public" / "images"


def sync_app(app_name: str, *, dry_run: bool = False) -> list[str]:
    """同步单个应用的图片资源。

    Args:
        app_name: 应用名称
        dry_run: 仅检查不执行

    Returns:
        操作日志列表
    """
    source = ASSETS_IMAGES / app_name
    target = APP_IMAGE_DIRS.get(app_name)
    logs: list[str] = []

    if not source.exists():
        logs.append(f"  [跳过] assets/images/{app_name}/ 不存在")
        return logs

    if target is None:
        logs.append(f"  [跳过] 应用 {app_name} 未在 apps/ 中找到")
        return logs

    # 确保目标目录存在
    if not dry_run:
        target.mkdir(parents=True, exist_ok=True)

    source_files = {f.name: f for f in source.iterdir() if f.is_file()}
    target_files = (
        {f.name: f for f in target.iterdir() if f.is_file()} if target.exists() else {}
    )

    # 同步新增/更新的文件
    for name, src_file in sorted(source_files.items()):
        dst_file = target / name
        if name not in target_files:
            logs.append(f"  [新增] {name}")
            if not dry_run:
                shutil.copy2(src_file, dst_file)
        else:
            # 检查文件是否不同（基于大小和修改时间）
            src_stat = src_file.stat()
            dst_stat = dst_file.stat()
            if (
                src_stat.st_size != dst_stat.st_size
                or src_stat.st_mtime > dst_stat.st_mtime
            ):
                logs.append(f"  [更新] {name}")
                if not dry_run:
                    shutil.copy2(src_file, dst_file)
            else:
                logs.append(f"  [一致] {name}")

    # 标记目标中存在但源中不存在的文件
    for name in sorted(target_files):
        if name not in source_files:
            logs.append(
                f"  [孤立] {name} (仅存在于 public/images/，未在 assets/images/ 中管理)"
            )

    return logs


def main() -> None:
    parser = argparse.ArgumentParser(description="同步图片资源到各应用")
    parser.add_argument("apps", nargs="*", help="指定要同步的应用名（留空则同步全部）")
    parser.add_argument("--check", action="store_true", help="仅检查，不执行同步")
    args = parser.parse_args()

    discover_apps()

    if not APP_IMAGE_DIRS:
        print("未发现任何应用，请确认 apps/ 目录结构正确。")
        sys.exit(1)

    apps_to_sync = args.apps if args.apps else list(APP_IMAGE_DIRS.keys())
    mode = "检查模式" if args.check else "同步模式"
    print(f"图片资源同步 ({mode})")
    print(f"  源目录: {ASSETS_IMAGES}")
    print(f"  应用数: {len(apps_to_sync)}")
    print()

    has_changes = False
    for app_name in apps_to_sync:
        print(f"[{app_name}]")
        logs = sync_app(app_name, dry_run=args.check)
        if not logs:
            print("  (无文件)")
        else:
            for log in logs:
                print(log)
                if "[新增]" in log or "[更新]" in log or "[孤立]" in log:
                    has_changes = True
        print()

    if args.check and has_changes:
        print("发现差异，运行 `python scripts/sync_images.py` 执行同步。")
        sys.exit(1)
    elif not has_changes:
        print("所有图片资源已同步。")


if __name__ == "__main__":
    main()
