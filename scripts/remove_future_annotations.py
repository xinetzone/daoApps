#!/usr/bin/env python3
"""
批量移除 Python 文件中的 from __future__ import annotations 语句。
"""

import os
import re
from pathlib import Path


def remove_future_annotations(file_path: Path) -> bool:
    """移除文件中的 from __future__ import annotations 语句。

    Args:
        file_path: 文件路径

    Returns:
        是否成功移除
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 匹配 from __future__ import annotations 语句
        pattern = r'^\s*from\s+__future__\s+import\s+annotations\s*$\n'
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE)

        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {e}")
        return False


def main():
    """主函数。"""
    # 遍历项目目录
    project_root = Path('.')
    count = 0

    for file_path in project_root.rglob('*.py'):
        # 跳过 .git 目录和其他非源码目录
        if any(part in file_path.parts for part in ['.git', '__pycache__', 'env', 'venv']):
            continue

        # 检查文件是否包含 from __future__ import annotations
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'from __future__ import annotations' in content:
                if remove_future_annotations(file_path):
                    print(f"已处理: {file_path}")
                    count += 1
        except Exception as e:
            print(f"检查文件 {file_path} 时出错: {e}")

    print(f"\n处理完成，共修改 {count} 个文件。")


if __name__ == '__main__':
    main()
