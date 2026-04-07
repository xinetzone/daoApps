@echo off

:: 仓库大小分析批处理脚本
:: 用于定期运行仓库大小分析

cd /d "d:\xinet\spaces\tao"

:: 运行仓库大小分析脚本
python scripts\repo_size_analyzer.py

:: 记录运行时间
echo 分析完成于 %date% %time% >> analysis_log.txt

:: 按任意键退出
:: pause
