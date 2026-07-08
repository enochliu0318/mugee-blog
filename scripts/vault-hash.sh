#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <密码>"
  echo "示例: $0 my-secret-password"
  exit 1
fi

printf '%s' "$1" | sha256sum | awk '{print $1}'
