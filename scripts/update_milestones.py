#!/usr/bin/env python3
"""
更新里程碑信息脚本

动态生成里程碑日期并更新配置文件。
"""

import sys
from pathlib import Path
import tomli
import tomli_w
from datetime import datetime

# 项目根目录
ROOT = Path(__file__).resolve().parent.parent

# 配置文件路径
CONFIG_FILE = ROOT / "config-template.toml"

def update_milestones():
    """更新里程碑信息。"""
    # 加载配置文件
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "rb") as f:
            config = tomli.load(f)
    else:
        config = {}
    
    # 确保 milestones 部分存在
    if "milestones" not in config:
        config["milestones"] = {}
    
    # 获取当前日期
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    # 更新里程碑日期
    milestones = {
        "phase_a": {"name": "安全修复", "status": "完成", "date": current_date},
        "phase_b": {"name": "Monorepo 基础设施", "status": "完成", "date": current_date},
        "phase_c": {"name": "共享前端包", "status": "完成", "date": current_date},
        "phase_d": {"name": "类型安全与质量提升", "status": "完成", "date": current_date}
    }
    
    config["milestones"] = milestones
    
    # 保存配置文件
    with open(CONFIG_FILE, "wb") as f:
        tomli_w.dump(config, f)
    
    print(f"里程碑信息已更新，日期设置为: {current_date}")

def main():
    """主函数。"""
    update_milestones()


if __name__ == "__main__":
    main()
