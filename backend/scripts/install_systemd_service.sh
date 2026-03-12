#!/usr/bin/env bash
set -euo pipefail

# Installs and enables a systemd unit that deploys/starts backend container on boot.
# Run as root or with sudo:
#   sudo APP_DIR=/opt/catalogit/backend ./scripts/install_systemd_service.sh

APP_DIR="${APP_DIR:-/opt/catalogit/backend}"
SERVICE_NAME="${SERVICE_NAME:-catalogit-backend.service}"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "APP_DIR does not exist: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/.env.production" ]]; then
  echo "Missing ${APP_DIR}/.env.production" >&2
  echo "Create it from .env.production.example before installing the service." >&2
  exit 1
fi

if [[ ! -x "${APP_DIR}/scripts/deploy_ec2_backend.sh" ]]; then
  echo "Making deploy script executable..."
  chmod +x "${APP_DIR}/scripts/deploy_ec2_backend.sh"
fi

if [[ ! -x "${APP_DIR}/scripts/check_prod_env.sh" ]]; then
  echo "Making env validation script executable..."
  chmod +x "${APP_DIR}/scripts/check_prod_env.sh"
fi

cat > "${SERVICE_PATH}" <<EOF
[Unit]
Description=CatalogIt backend container deploy/start
After=network-online.target docker.service
Wants=network-online.target docker.service

[Service]
Type=oneshot
WorkingDirectory=${APP_DIR}
ExecStart=/bin/bash -lc 'set -a && source .env.production && set +a && ./scripts/deploy_ec2_backend.sh'
TimeoutStartSec=0
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl start "${SERVICE_NAME}"
systemctl status "${SERVICE_NAME}" --no-pager

echo "Installed and started ${SERVICE_NAME}"
