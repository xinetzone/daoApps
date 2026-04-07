#!/bin/bash
# Podman Pod 启动脚本（无 podman-compose 时的替代方案）
# 用途：使用 Podman Pod 模式手动启动所有服务

set -e

POD_NAME="taolib-pod"

echo "====================================="
echo "  Podman Pod 启动"
echo "====================================="
echo ""

# 检查 Podman 是否安装
if ! command -v podman &> /dev/null; then
    echo "错误: Podman 未安装"
    exit 1
fi

# 检查 Pod 是否已存在
if podman pod inspect $POD_NAME &> /dev/null; then
    echo "Pod '$POD_NAME' 已存在，正在删除..."
    podman pod stop $POD_NAME
    podman pod rm $POD_NAME
    echo ""
fi

# 创建 Pod
echo "创建 Pod '$POD_NAME'..."
podman pod create --name $POD_NAME \
  -p 27017:27017 \
  -p 6379:6379 \
  -p 9200:9200 \
  -p 8000:8000 \
  -p 8100:8100 \
  -p 3000:80

echo "✓ Pod 创建完成"
echo ""

# 启动基础设施容器
echo "启动基础设施容器..."

echo "  - 启动 MongoDB..."
podman run -d --pod $POD_NAME --name mongodb \
  -v mongo-data:/data/db \
  docker.io/library/mongo:7

echo "  - 启动 Redis..."
podman run -d --pod $POD_NAME --name redis \
  -v redis-data:/data \
  docker.io/library/redis:7-alpine

echo "  - 启动 Elasticsearch..."
podman run -d --pod $POD_NAME --name elasticsearch \
  -v es-data:/usr/share/elasticsearch/data \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0

echo "✓ 基础设施容器启动完成"
echo ""

# 等待基础设施启动
echo "等待基础设施启动（30 秒）..."
sleep 30
echo ""

# 启动应用服务
echo "启动应用服务..."

echo "  - 启动配置中心..."
podman run -d --pod $POD_NAME --name config-center \
  -e "MONGO_URL=mongodb://localhost:27017" \
  -e "REDIS_URL=redis://localhost:6379" \
  -e "JWT_SECRET=change-me" \
  localhost/taolib-config-center:latest

echo "  - 启动日志平台 API..."
podman run -d --pod $POD_NAME --name log-platform-api \
  -e "LOG_PLATFORM_ES_URL=http://localhost:9200" \
  -e "LOG_PLATFORM_MONGO_URL=mongodb://localhost:27017" \
  -e "LOG_PLATFORM_REDIS_URL=redis://localhost:6379" \
  localhost/taolib-log-platform:latest

echo "  - 启动日志平台 Worker..."
podman run -d --pod $POD_NAME --name log-platform-worker \
  -e "LOG_PLATFORM_ES_URL=http://localhost:9200" \
  -e "LOG_PLATFORM_MONGO_URL=mongodb://localhost:27017" \
  -e "LOG_PLATFORM_REDIS_URL=redis://localhost:6379" \
  localhost/taolib-log-platform:latest python -m taolib.log_platform.server.worker

echo "✓ 应用服务启动完成"
echo ""

echo "====================================="
echo "  所有服务已启动"
echo "====================================="
echo ""
echo "访问地址："
echo "  - 配置中心 API: http://localhost:8000/docs"
echo "  - 日志平台 API: http://localhost:8100/docs"
echo "  - 前端界面:     http://localhost:3000"
echo ""
echo "管理命令："
echo "  - 查看 Pod 状态:  podman pod ps"
echo "  - 查看容器状态:  podman ps"
echo "  - 查看服务日志:  podman logs <container-name>"
echo "  - 停止所有服务:  bash scripts/podman-stop.sh"
echo ""
