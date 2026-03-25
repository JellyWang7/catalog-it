# Personal ops memory — CatalogIt / AWS

## Cost discipline (default)

- **Always prefer the minimal-cost plan** for class/portfolio use: smallest instance classes, single-AZ, minimal storage, no extra services unless required.
- **Assume non-zero baseline spend** while resources exist (EBS, RDS storage, ECR image storage, S3, possible Elastic IP charge when EC2 is stopped — verify in AWS Billing).

## Idle / auto shutdown (target: ~30 min no activity)

**Ideal:** automate stop of **EC2** (and **RDS** if you use stop/start) after ~30 minutes of no meaningful activity.

**Reality check:** “No activity for 30 minutes” is **not** a single AWS button. You must define **what counts as activity** (e.g. HTTP traffic to the API, only during your demo window) and implement it with something like:

- **EventBridge Scheduler** / Lambda to **stop** instances on a schedule or after a timer you control, or  
- A **cost-focused schedule** you already have (e.g. nightly stop) — extend mentally: “if I’m not demoing, keep it stopped.”

**If full auto-idle shutdown is too much work:** set **calendar + phone reminders** every time you start the stack:

- Reminder **30 minutes later**: “Stop EC2 + RDS (if started) — check AWS console.”
- Optional weekly: “Delete old ECR tags / verify Elastic IP not idle-charging.”

## Manual checklist when ending a session

- [ ] Stop **EC2** (if not needed)
- [ ] Stop **RDS** (if your workflow allows; remember storage still bills)
- [ ] Confirm **Elastic IP** situation (avoid idle EIP charges)
- [ ] Note: **S3 + CloudFront** stay up — usually cheap; not “shut down” like compute

## Deploy gotchas (short)

- **CloudFront** must route **`/api/*`** to **EC2**, not only S3 — otherwise Explore breaks and `/up` shows the React 404 page.
- **`docker pull`** then always **`docker rm`** + **`docker run`** to pick up a new image.
- **`curl 127.0.0.1/up`** for health only **on EC2** (or use CloudFront URL from your laptop).
- **`rails db:seed` in prod** = wipe users/lists unless you changed `seeds.rb`.

## Docs to keep aligned

- `pickup.md` — next-session deploy handoff  
- `root_cause_deplpyment_lessons.md` — full timeline + lessons H–L

## “Pickup” (for you + for the assistant)

When you say **“pickup”**, resume from **`pickup.md`** — especially **§0 (where we left off)** and **`next_week.md`** for carryover. Treat that as the source of truth for the next deploy step (ECR, EC2 container recreate, `db:migrate`, smoke tests).
