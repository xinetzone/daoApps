#!/bin/bash
# Podman 镜像构建脚本
# 用途：构建配置中心、日志平台和前端的容器镜像

set -e

echo "====================================="
echo "  Podman 镜像构建"
echo "====================================="
echo ""

# 检查 Podman 是否安装
if ! command -v podman &> /dev/null; then
    echo "错误: Podman 未安装"
    echo "请先安装 Podman: https://podman.io/getting-started/installation"
    exit 1
fi

echo "Podman 版本:"
podman --version
echo ""

# 构建配置中心镜像
echo "[1/3] 构建配置中心镜像..."
podman build -t localhost/taolib-config-center:latest -f Containerfile.config-center .
echo "✓ 配置中心镜像构建完成"
echo ""

# 构建日志平台镜像
echo "[2/3] 构建日志平台镜像..."
podman build -t localhost/taolib-log-platform:latest -f Containerfile.log-platform .
echo "✓ 日志平台镜像构建完成"
echo ""

# 构建前端镜像
echo "[3/3] 构建前端镜像..."
cd frontend
podman build -t localhost/taolib-log-platform-frontend:latest -f Containerfile .
cd ..
echo "✓ 前端镜像构建完成"
echo ""

echo "====================================="
echo "  所有镜像构建完成"
echo "====================================="
echo ""
echo "已构建的镜像:"
podman images | grep taolib
echo ""
echo "下一步: 运行 podman-compose up -d 启动所有服务"
