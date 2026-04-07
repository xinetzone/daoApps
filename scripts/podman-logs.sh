#!/bin/bash
# Podman 日志查看脚本
# 用途：查看服务日志

SERVICE=${1:-all}

if [ "$SERVICE" = "all" ]; then
    echo "====================================="
    echo "  所有服务日志"
    echo "====================================="
    echo ""
    
    # 检查是否使用 podman-compose
    if command -v podman-compose &> /dev/null && [ -f podman-compose.yml ]; then
        podman-compose logs -f
    else
        # 使用 Pod 模式
        POD_NAME="taolib-pod"
        if podman pod inspect $POD_NAME &> /dev/null; then
            echo "注意: Pod 模式不直接支持查看所有日志"
            echo "请查看单个容器日志:"
            podman ps --pod --format "table {{.Names}}" | grep -v NAMES | while read container; do
                echo ""
                echo "=== $container ==="
                podman logs --tail 50 $container
            done
        else
            echo "错误: 未找到运行中的服务"
            exit 1
        fi
    fi
else
    echo "====================================="
    echo "  $SERVICE 日志"
    echo "====================================="
    echo ""
    podman logs -f $SERVICE
fi
