#!/bin/bash
# Podman Pod 停止脚本
# 用途：停止并删除所有服务

POD_NAME="taolib-pod"

echo "====================================="
echo "  Podman Pod 停止"
echo "====================================="
echo ""

# 检查 Pod 是否存在
if ! podman pod inspect $POD_NAME &> /dev/null; then
    echo "Pod '$POD_NAME' 不存在"
    exit 0
fi

echo "停止 Pod..."
podman pod stop $POD_NAME

echo "删除 Pod..."
podman pod rm $POD_NAME

echo ""
echo "✓ 所有服务已停止"
echo ""
echo "注意：数据卷未删除，数据已保留"
echo "如需删除数据卷，运行: podman volume rm mongo-data redis-data es-data"
