#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_HOST="${TASKMENTOR_DEPLOY_HOST:-maziar@192.168.2.248}"
REMOTE_PROJECT_DIR="${TASKMENTOR_REMOTE_DIR:-/home/maziar/TaskMentor}"
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_TEMP_DIR="$(mktemp -d /tmp/taskmentor-deploy.XXXXXX)"
DEPLOY_ARCHIVE="$DEPLOY_TEMP_DIR/taskmentor-source.tar.gz"
SSH_SOCKET="$DEPLOY_TEMP_DIR/ssh-control"
REMOTE_ARCHIVE="/tmp/taskmentor-source-${USER:-user}.tar.gz"
SSH_CONNECTED=0

cleanup() {
  if (( SSH_CONNECTED )); then
    ssh -S "$SSH_SOCKET" -O exit "$DEPLOY_HOST" >/dev/null 2>&1 || true
  fi

  [[ ! -f "$DEPLOY_ARCHIVE" ]] || unlink "$DEPLOY_ARCHIVE"
  [[ ! -d "$DEPLOY_TEMP_DIR" ]] || rmdir "$DEPLOY_TEMP_DIR"
}

trap cleanup EXIT

for command_name in flock npm tar ssh scp; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "خطا: دستور $command_name روی سیستم نصب نیست." >&2
    exit 1
  fi
done

echo "[1/6] ساخت نسخه نهایی فرانت‌اند..."
cd "$PROJECT_DIR"
npm run build

echo "[2/6] آماده‌سازی فایل‌های پروژه..."
tar -czf "$DEPLOY_ARCHIVE" \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='node_modules' \
  --exclude='*/node_modules' \
  --exclude='dist' \
  --exclude='*/dist' \
  --exclude='./server/logs' \
  --exclude='./TaskMentor-backups' \
  -C "$PROJECT_DIR" .

echo "[3/6] اتصال به $DEPLOY_HOST (رمز SSH را وارد کنید)..."
ssh \
  -M \
  -S "$SSH_SOCKET" \
  -o ControlPersist=300 \
  -o StrictHostKeyChecking=accept-new \
  -fnNT "$DEPLOY_HOST"
SSH_CONNECTED=1

echo "[4/6] گرفتن بکاپ از نسخه فعلی سرور..."
ssh -S "$SSH_SOCKET" "$DEPLOY_HOST" bash -s -- "$REMOTE_PROJECT_DIR" <<'REMOTE_BACKUP'
set -Eeuo pipefail

remote_project_dir="$1"
if [[ -z "$remote_project_dir" || "$remote_project_dir" == "/" || "$remote_project_dir" == "$HOME" ]]; then
  echo "مسیر پروژه روی سرور امن نیست: $remote_project_dir" >&2
  exit 1
fi
if [[ ! -d "$remote_project_dir" ]]; then
  echo "پوشه پروژه روی سرور پیدا نشد: $remote_project_dir" >&2
  exit 1
fi

backup_dir="$HOME/TaskMentor-backups"
backup_stamp="$(date +%Y%m%d-%H%M%S)"
backup_file="$backup_dir/project-before-$backup_stamp.tar.gz"
mkdir -p "$backup_dir"
tar -czf "$backup_file" \
  --exclude='node_modules' \
  --exclude='*/node_modules' \
  --exclude='dist' \
  --exclude='*/dist' \
  -C "$remote_project_dir" .
echo "بکاپ: $backup_file"
REMOTE_BACKUP

echo "[5/6] انتقال و نصب نسخه جدید..."
scp \
  -o ControlPath="$SSH_SOCKET" \
  "$DEPLOY_ARCHIVE" \
  "$DEPLOY_HOST:$REMOTE_ARCHIVE"

ssh -S "$SSH_SOCKET" "$DEPLOY_HOST" bash -s -- \
  "$REMOTE_PROJECT_DIR" "$REMOTE_ARCHIVE" <<'REMOTE_DEPLOY'
set -Eeuo pipefail

remote_project_dir="$1"
remote_archive="$2"
frontend_service="taskmentor-frontend.service"
server_service="taskmentor-server.service"
deploy_lock="$HOME/.taskmentor-deploy.lock"

exec 9>"$deploy_lock"
if ! flock -n 9; then
  echo "یک استقرار دیگر TaskMentor روی سرور در حال اجراست." >&2
  exit 1
fi

restart_services() {
  systemctl --user restart "$frontend_service" "$server_service" || true
}

trap restart_services ERR

export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"
if ! timeout 20 npm ping --registry=https://registry.npmjs.org >/dev/null 2>&1; then
  echo "دسترسی سرور به npm registry برقرار نیست؛ نسخه در حال اجرا متوقف نشد." >&2
  exit 1
fi

tar -xzf "$remote_archive" -C "$remote_project_dir"
unlink "$remote_archive"

cd "$remote_project_dir"
timeout 180 npm install --no-audit --no-fund --prefer-offline
cd "$remote_project_dir/server"
timeout 180 npm install --no-audit --no-fund --prefer-offline

systemctl --user restart "$frontend_service" "$server_service"
trap - ERR
REMOTE_DEPLOY

echo "[6/6] بررسی سرویس‌ها و نسخه در حال اجرا..."
ssh -S "$SSH_SOCKET" "$DEPLOY_HOST" bash -s <<'REMOTE_VERIFY'
set -Eeuo pipefail

systemctl --user is-active --quiet taskmentor-frontend.service
systemctl --user is-active --quiet taskmentor-server.service

for attempt in {1..15}; do
  if curl -fsS http://127.0.0.1:3000/ >/dev/null; then
    echo "فرانت‌اند: فعال روی پورت 3000"
    echo "بک‌اند: فعال روی پورت 4444"
    exit 0
  fi
  sleep 1
done

echo "فرانت‌اند بعد از 15 ثانیه پاسخ نداد." >&2
exit 1
REMOTE_VERIFY

echo "استقرار با موفقیت انجام شد: http://192.168.2.248:3000"
