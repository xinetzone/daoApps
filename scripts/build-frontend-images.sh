#!/usr/bin/env bash
# ============================================
# 批量构建前端容器镜像
# 用法: bash scripts/build-frontend-images.sh [app1 app2 ...]
# 无参数时构建所有前端应用
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONTAINERFILE="${PROJECT_ROOT}/deploy/frontend/Containerfile.pnpm"

# 所有可构建的前端应用列表
ALL_APPS=(config-center oauth-admin forum growth-tracker habit-tracker moodflow xinyu time-capsule qrcode-studio)

# 如果提供了参数，只构建指定的应用；否则构建所有
if [ $# -gt 0 ]; then
    APPS=("$@")
else
    APPS=("${ALL_APPS[@]}")
fi

BUILDER="${CONTAINER_ENGINE:-podman}"

echo "=== 前端容器镜像批量构建 ==="
echo "容器引擎: ${BUILDER}"
echo "构建应用: ${APPS[*]}"
echo ""

FAILED=()

for APP in "${APPS[@]}"; do
    APP_DIR="${PROJECT_ROOT}/apps/${APP}"
    if [ ! -d "${APP_DIR}" ]; then
        echo "[跳过] apps/${APP}/ 目录不存在"
        continue
    fi

    IMAGE_TAG="localhost/taolib-${APP}-ui:latest"
    echo "[构建] ${APP} -> ${IMAGE_TAG}"

    if ${BUILDER} build \
        -f "${CONTAINERFILE}" \
        --build-arg "APP_NAME=${APP}" \
        -t "${IMAGE_TAG}" \
        "${PROJECT_ROOT}"; then
        echo "[成功] ${APP}"
    else
        echo "[失败] ${APP}"
        FAILED+=("${APP}")
    fi
    echo ""
done

echo "=== 构建完成 ==="
if [ ${#FAILED[@]} -gt 0 ]; then
    echo "失败的应用: ${FAILED[*]}"
    exit 1
else
    echo "所有应用构建成功"
fi
