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

## Docs to keep aligned

- `pickup.md` — next-session deploy handoff  
- `root_cause_deplpyment_lessons.md` — 504 when EC2 stopped, etc.
