# Security: what must never be committed

**Last updated:** April 2026  

These patterns are **gitignored** in this repo — do not force-add them, and do not paste real secrets into markdown that gets committed.

**Design docs:** The `docs/` tree is **intended to be committed** (see [docs/README.md](docs/README.md)). Treat it like any other public doc: placeholders only for secrets and live AWS IDs.

| Never commit | Notes |
|--------------|--------|
| `backend/.env.production` | Real DB passwords, `SECRET_KEY_BASE`, AWS keys, JWT secrets |
| `backend/.env`, `frontend/.env*` (except `.env.example`) | Local overrides |
| `backend/config/database.yml` | Contains credentials (use `*.example` templates) |
| `backend/config/master.key` | Decrypts `credentials.yml.enc` |
| `infra/terraform.tfvars`, `*.tfstate*`, `.terraform/` | Cloud IDs, secrets |
| `backend/.kamal/secrets*` | Deploy secrets |
| `*.pem`, `*.key` | TLS or SSH private material |
| **Raw API keys, JWTs, DB URLs** in any `*.md` | Use placeholders like `<SECRET_KEY_BASE>` |
| **Passwords** (seed, demo, or production) in committed `*.md` | Point readers to **`db/seeds.rb`** locally for dev-only seeds; never document real production credentials |

**Operational IDs in docs:** Prefer placeholders (`<instance-id>`, `<cloudfront-domain>`) instead of real AWS resource IDs in files that ship to git — especially public remotes.

See [.gitignore](.gitignore). For production env setup, use `backend/.env.production.example` and copy locally without committing the filled file.
