#!/usr/bin/env python3
"""
配置加载脚本

加载 config-template.toml 配置文件，提供配置值给其他脚本使用。
"""

import os
from pathlib import Path

import tomli

# 项目根目录
ROOT = Path(__file__).resolve().parent.parent

# 配置文件路径
CONFIG_FILE = ROOT / "config-template.toml"

# 全局配置对象
_config = None

def load_config() -> dict:
    """加载配置文件。"""
    global _config
    if _config is None:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, "rb") as f:
                _config = tomli.load(f)
        else:
            _config = {}
    return _config

def get_config(key: str, default=None):
    """获取配置值，支持点号分隔的路径。"""
    config = load_config()
    parts = key.split(".")
    value = config
    for part in parts:
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return default
    # 处理变量引用 ${VAR:-default} 或 ${section.key}
    if isinstance(value, str):
        import re
        pattern = r'\$\{([^}]+)\}'
        matches = re.findall(pattern, value)
        for match in matches:
            if "-" in match:
                var_name, default_val = match.split("-", 1)
                var_name = var_name.strip()
                default_val = default_val.strip()
                # 检查是否是配置变量引用
                if "." in var_name:
                    config_val = get_config(var_name, default_val)
                    value = value.replace(f"${{{match}}}", config_val)
                else:
                    # 环境变量引用
                    env_val = os.environ.get(var_name, default_val)
                    value = value.replace(f"${{{match}}}", env_val)
            else:
                var_name = match.strip()
                # 检查是否是配置变量引用
                if "." in var_name:
                    config_val = get_config(var_name)
                    if config_val is not None:
                        value = value.replace(f"${{{match}}}", str(config_val))
                else:
                    # 环境变量引用
                    env_val = os.environ.get(var_name, "")
                    value = value.replace(f"${{{match}}}", env_val)
    return value

def main():
    """测试配置加载。"""
    config = load_config()
    print("配置加载成功:")
    print(f"Python 环境: {get_config('python.env_dir')}")
    print(f"Config Center 端口: {get_config('ports.config_center')}")
    print(f"API 基础 URL: {get_config('examples.api_base_url')}")
    print(f"PyPI 链接: {get_config('links.pypi')}")


if __name__ == "__main__":
    main()
