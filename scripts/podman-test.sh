#!/bin/bash
# Podman 部署集成测试脚本
# 用途：验证所有服务是否正常工作

set -e

echo "====================================="
echo "  Podman 部署集成测试"
echo "====================================="
echo ""

FAILED=0

# 1. 测试 Elasticsearch
echo "[1/6] 测试 Elasticsearch..."
if curl -sf http://localhost:9200/_cluster/health | grep -q '"status":"green"'; then
    echo "  ✓ Elasticsearch 正常"
else
    echo "  ✗ Elasticsearch 异常"
    FAILED=$((FAILED + 1))
fi

# 2. 测试 MongoDB
echo "[2/6] 测试 MongoDB..."
if podman exec taolib-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1 || \
   podman exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "  ✓ MongoDB 正常"
else
    echo "  ✗ MongoDB 异常"
    FAILED=$((FAILED + 1))
fi

# 3. 测试 Redis
echo "[3/6] 测试 Redis..."
if podman exec taolib-redis redis-cli ping 2>/dev/null | grep -q "PONG" || \
   podman exec redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "  ✓ Redis 正常"
else
    echo "  ✗ Redis 异常"
    FAILED=$((FAILED + 1))
fi

# 4. 测试配置中心
echo "[4/6] 测试配置中心..."
if curl -sf http://localhost:8000/docs > /dev/null 2>&1; then
    echo "  ✓ 配置中心正常"
else
    echo "  ✗ 配置中心异常"
    FAILED=$((FAILED + 1))
fi

# 5. 测试日志平台
echo "[5/6] 测试日志平台..."
if curl -sf http://localhost:8100/docs > /dev/null 2>&1; then
    echo "  ✓ 日志平台正常"
else
    echo "  ✗ 日志平台异常"
    FAILED=$((FAILED + 1))
fi

# 6. 发送测试日志
echo "[6/6] 发送测试日志..."
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RESPONSE=$(curl -sf -X POST http://localhost:8100/api/v1/logs/ingest \
  -H "Content-Type: application/json" \
  -d "{\"timestamp\": \"$TIMESTAMP\", \"service\": \"test\", \"level\": \"INFO\", \"message\": \"Podman 部署测试\"}" 2>&1)

if [ $? -eq 0 ]; then
    echo "  ✓ 日志发送正常"
else
    echo "  ✗ 日志发送异常"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "====================================="
if [ $FAILED -eq 0 ]; then
    echo "  所有测试通过 ✓"
else
    echo "  $FAILED 个测试失败 ✗"
fi
echo "====================================="

exit $FAILED
