#!/bin/bash
# Podman 健康检查脚本
# 用途：检查所有服务的健康状态

echo "====================================="
echo "  服务健康检查"
echo "====================================="
echo ""

FAILED=0

# Elasticsearch
echo -n "Elasticsearch (9200): "
if curl -sf http://localhost:9200/_cluster/health | grep -q '"status":"green"'; then
    echo "✓ 正常"
else
    echo "✗ 异常"
    FAILED=$((FAILED + 1))
fi

# MongoDB
echo -n "MongoDB (27017): "
if podman exec taolib-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ 正常"
else
    # 尝试使用 podman-compose 的容器名
    if podman exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✓ 正常"
    else
        echo "✗ 异常"
        FAILED=$((FAILED + 1))
    fi
fi

# Redis
echo -n "Redis (6379): "
if podman exec taolib-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "✓ 正常"
else
    if podman exec redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo "✓ 正常"
    else
        echo "✗ 异常"
        FAILED=$((FAILED + 1))
    fi
fi

# Config Center
echo -n "配置中心 (8000): "
if curl -sf http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✓ 正常"
else
    echo "✗ 异常"
    FAILED=$((FAILED + 1))
fi

# Log Platform API
echo -n "日志平台 API (8100): "
if curl -sf http://localhost:8100/docs > /dev/null 2>&1; then
    echo "✓ 正常"
else
    echo "✗ 异常"
    FAILED=$((FAILED + 1))
fi

# Frontend
echo -n "前端界面 (3000): "
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ 正常"
else
    echo "✗ 异常"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "====================================="
if [ $FAILED -eq 0 ]; then
    echo "  所有服务运行正常 ✓"
else
    echo "  $FAILED 个服务异常 ✗"
fi
echo "====================================="

exit $FAILED
