# Prod-like smoke test on your Mac (before EC2)

Runs the **same backend `Dockerfile`** as production with **`RAILS_ENV=production`**, against a **local Postgres** container. Your `backend/.env.production` supplies secrets (`RAILS_MASTER_KEY`, `SECRET_KEY_BASE`, …); **`DATABASE_*` and local-only flags are overridden** by `docker-compose.prod-local.yml` so you do **not** hit RDS.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- File **`backend/.env.production`** (gitignored) with at least:
  - `RAILS_MASTER_KEY`
  - `SECRET_KEY_BASE`
  - Other vars required at boot (run `set -a && source backend/.env.production && set +a && backend/scripts/check_prod_env.sh --skip-s3-check` to validate)

## One command

From the **catalog-it** repo root:

```bash
chmod +x scripts/smoke_prod_local.sh
./scripts/smoke_prod_local.sh
```

API listens on **`http://127.0.0.1:8088`** (maps to Thruster/Rails port 80 in the image).

## Manual compose (optional)

```bash
docker compose -f docker-compose.prod-local.yml up -d --build
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8088/up
```

## Stop / reset

```bash
docker compose -f docker-compose.prod-local.yml down
# Remove DB volume if you added one (this compose file does not mount a named volume; DB is ephemeral per down)
```

## SSL toggles

Local HTTP would break with `force_ssl` + `assume_ssl` as on EC2. The compose file sets **`ASSUME_SSL=false`** and **`FORCE_SSL=false`**. On EC2, omit these (defaults stay **true**).

See `config/environments/production.rb`.
