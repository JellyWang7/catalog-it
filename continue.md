# Continue here — deploy checklist & lessons learned

Single reference for **laptop → ECR → EC2** backend deploys and pitfalls we hit.

---

## Recommended path: always build on laptop, push to ECR

Avoid `docker build` on small EC2 instances (slow, easy to look “stuck”). Use **`deploy_ecr_push.sh`** on the Mac, then **`deploy_ec2_backend.sh --pull`** on EC2.

### On your Mac (build image → push ECR)

Prerequisites: Docker running, AWS CLI authenticated with ECR push rights.

```bash
cd /Users/Jelly1/Documents/my-app/catalogIt/catalog-it && git pull origin deployment && cd backend && export ECR_REPO=106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend && export AWS_REGION=us-east-1 && bash ./scripts/deploy_ecr_push.sh
```

Adjust `ECR_REPO` / `AWS_REGION` if your account differs. Full URI shape:

`{account-id}.dkr.ecr.{region}.amazonaws.com/catalogit-backend`

**Find account ID & region (CLI):**

```bash
aws sts get-caller-identity --query Account --output text
aws configure get region
```

### On EC2 (pull image → run container)

Prerequisites: repo cloned at e.g. `~/catalog-it`, **`backend/.env.production`** exists on the server (gitignored — create from `.env.production.example`).

```bash
cd ~/catalog-it && git pull origin deployment && cd backend && export ECR_REPO=106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend && export AWS_REGION=us-east-1 && chmod +x scripts/deploy_ec2_backend.sh scripts/check_prod_env.sh && set -a && source .env.production && set +a && ./scripts/deploy_ec2_backend.sh --pull
```

**Order:** Mac push first, then EC2 deploy.

---

## Lessons learned

### 1. Don’t use placeholder paths literally

- `/path/to/catalog-it` was documentation only — use the real path (`~/catalog-it` on EC2, or your Mac path).
- Scripts live under **`backend/scripts/`** — run deploy commands from **`backend/`**.

### 2. Gemfile.lock CHECKSUMS + frozen Bundler (Docker)

Docker sets **`BUNDLE_DEPLOYMENT=1`** (frozen install). If **`Gemfile.lock`** has **CHECKSUMS lines without `sha256=`** (e.g. `bigdecimal (4.1.0)` with no hash), **`bundle install` fails** inside the image.

**Fix:** On a dev machine with checksum validation **on**, run:

```bash
cd backend
bundle config unset disable_checksum_validation   # if it was set locally
bundle lock --add-checksums
```

Commit the updated **`Gemfile.lock`**. If **`BUNDLE_DISABLE_CHECKSUM_VALIDATION=true`** is in **`backend/.bundle/config`**, Bundler may never write proper checksums — avoid that for lockfiles you commit.

### 3. Ruby 4.0 + `rswag-ui` + `ostruct`

Ruby **4.0** removed **`ostruct`** from default gems. **`rswag-ui`** requires it but does not declare the gem. Because **`rswag-api` / `rswag-ui`** are in the default Gemfile group, **`Bundler.require`** loads them in **production**, so **`db:prepare`** in Docker failed with **`cannot load such file -- ostruct`**.

**Fix:** explicit **`gem "ostruct"`** in `Gemfile` (see repo history on `deployment`).

### 4. `.env.production` on EC2

- **`backend/.env.production`** is **not** in git. Create it on the server:

  ```bash
  cd ~/catalog-it/backend
  cp .env.production.example .env.production
  chmod 600 .env.production
  # edit with real SECRET_KEY_BASE, FRONTEND_URL, DATABASE_*, AWS_*, etc.
  ```

- **`set -a && source .env.production && set +a`** before **`deploy_ec2_backend.sh`** so **`check_prod_env.sh`** sees the variables.

### 5. Script output is not shell commands

After **`deploy_ecr_push.sh`**, the lines **`Done. On EC2 run:`** are **messages**, not commands. Do not paste **`Done.`** into the shell. Only run the **`export`** and **`./scripts/...`** lines (from the correct directory).

### 6. Docker build timing and CPU

- **`RUN bundle install`** can take **many minutes** (especially native extensions).
- BuildKit may show a step time that **doesn’t tick** while work continues.
- If **CloudWatch / `top` shows ~0% CPU for a long time** and the build looks frozen, it may be **stuck** — check the terminal or retry with **`docker build --progress=plain`** (on EC2) or prefer **laptop + ECR**.

### 7. GitHub branch rules

If **`git push origin fixed-prod`** is rejected on **`catalog-it`**, repository rules may **block creating that branch**. Use allowed branches (e.g. **`deployment`**) or adjust rules in GitHub **Settings → Rules**.

### 8. Docker on Mac vs EC2

- **Mac:** OK to quit Docker Desktop when not building/pushing.
- **EC2:** Don’t stop the Docker **daemon** if production containers run there; stopping **`catalogit_backend`** is intentional only when you mean to take the API down.

---

## Related docs

- **[DEMO.md](DEMO.md)** §2.3 — fast ECR path vs slow EC2 build path  
- **[backend/scripts/deploy_ecr_push.sh](backend/scripts/deploy_ecr_push.sh)** — laptop buildx + push  
- **[backend/scripts/deploy_ec2_backend.sh](backend/scripts/deploy_ec2_backend.sh)** — EC2 pull + `docker run` + `db:prepare`  
- **[backend/.env.production.example](backend/.env.production.example)** — template for server env file  
- **[root_cause_deployment_lessons.md](root_cause_deployment_lessons.md)** — deeper deploy history  

---

## Quick copy-paste summary

| Where | Command |
|-------|---------|
| **Mac** | `cd /Users/Jelly1/Documents/my-app/catalogIt/catalog-it && git pull origin deployment && cd backend && export ECR_REPO=106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend && export AWS_REGION=us-east-1 && bash ./scripts/deploy_ecr_push.sh` |
| **EC2** | `cd ~/catalog-it && git pull origin deployment && cd backend && export ECR_REPO=106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend && export AWS_REGION=us-east-1 && chmod +x scripts/deploy_ec2_backend.sh scripts/check_prod_env.sh && set -a && source .env.production && set +a && ./scripts/deploy_ec2_backend.sh --pull` |

Replace paths or `ECR_REPO` if your layout or AWS account differs.
