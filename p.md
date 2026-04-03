# CatalogIt — Final Project Presentation (Slide Copy)

**Document:** `p.md`  
**Last updated:** April 2026  

Use this file as **speaker notes / on-slide text** for your deck. Bullets are written to paste or shorten per slide.

---

## Slide 1 — Title Slide

**CatalogIt**  
*A Personalized Cataloging and Rating Platform*

**Final Project Presentation**

April 2026

---

## Slide 2 — Agenda

- Project Overview  
- Final System Architecture  
- Database and Security Implementation  
- DevOps and AWS Deployment  
- Final Product Features  
- Live Demonstration  
- Lessons Learned  
- Conclusion  

---

## Slide 3 — Project Overview

**Problem**  
Users struggle with fragmented lists across multiple applications and formats.

**Solution**  
**CatalogIt** is a unified web platform to **curate**, **rate**, and **share** lists across any category (movies, books, collectibles, and more).

**Status**  
The project has moved past midterm requirements. **Backend**, **frontend**, and **AWS deployment** are **complete** for the course scope, with full test coverage and production-oriented documentation for handoff (Wang, 2026).

---

## Slide 4 — Final System Architecture and Network Design

The application is deployed on a **cost-conscious AWS stack** (Terraform-managed).

- **Amazon CloudFront** is the single **HTTPS** entry point for users.  
- **Dual-origin routing:** static **React** assets are served from **S3** (origin access controlled); **`/api/*`**, **`/up`**, and related paths route to a **Ruby on Rails** API on **EC2** (same hostname avoids mixed-content and CORS pitfalls).  
- **Amazon RDS (PostgreSQL)** sits in a **private subnet**, reachable only from the application tier.  
- **Security groups** restrict database access; optional **start/stop schedules** limit runtime cost for demos and development.

*(Note: This design does **not** use an Application Load Balancer in front of Rails; CloudFront terminates TLS and forwards API traffic to EC2.)*

---

## Slide 5 — Database Design

- The schema was designed in **Third Normal Form (3NF)** before feature code hardened.  
- **Core entities:** Users, Lists, Items; **Attachments** (and related storage) support rich content at list and item level.  
- **Foreign keys** and **referential integrity** are enforced in PostgreSQL, reducing orphaned rows and keeping the API consistent with the data model.  
- **ActiveRecord encryption** protects sensitive fields at rest where applicable.

---

## Slide 6 — Application Security

**Defense in depth**

- **Transport:** TLS to the browser (**HTTPS** via CloudFront); Rails enforces **SSL** in production.  
- **Rest:** **AES-256-GCM** field encryption for designated sensitive attributes.  
- **Authentication:** **bcrypt** password hashing; **JWT** session tokens with sensible expiry.  
- **Authorization:** **Owner-based** checks and visibility rules reduce **IDOR** risk on private lists and items.  
- **Hardening:** Rate limiting (**Rack::Attack**), **CORS** locked to known origins, **XSS-aware** handling, **TOTP MFA** for elevated accounts, and **content moderation** on user-generated text (comments and notes) with clear **422** responses when policy blocks input.

---

## Slide 7 — DevOps and Cloud Deployment

- **Infrastructure as code:** **Terraform** provisions VPC-related resources, EC2, RDS, S3, CloudFront behaviors, scheduling, and budgets.  
- **Application delivery:** Backend ships as a **Docker** image on EC2; frontend is a **Vite** production build synced to **S3** with **CloudFront invalidation** when the API base URL or assets change.  
- **Operational docs:** Runbooks are consolidated in **`DEMO.md`** (local + AWS commands), **`DEPLOY_PLAN.md`** (architecture and phases), **`OPERATIONS.md`** (handoff and reminders), and **`SECURITY_GIT.md`** (what must never be committed).  
- **Incidents → knowledge:** Deployment blockers (IAM, **CloudFront** routing, **Docker** image refresh vs. `pull`, **Solid Cache** / throttling, credentials boot issues) were **root-caused and documented** for maintainability.

---

## Slide 8 — Final Product Features

- **React** frontend: responsive layout, **card-based** lists, mobile navigation.  
- **Full CRUD** for lists and items; **star ratings** and metadata.  
- **Social layer:** **comments** and **likes** on public and shared lists.  
- **Attachments:** optional **text notes**, **HTTPS links**, and **files** (typed uploads; **Active Storage** with **S3** in production when configured).  
- **Explore:** server-driven **search**, **sorting**, and **visibility** filters; **dashboard analytics** for engagement.  
- **Sharing:** short **share codes** and copy-friendly URLs.  
- **Automated tests:** backend **RSpec**, frontend **Vitest** and **Playwright** E2E.

---

## Slide 9 — Live Demonstration

This segment showcases the **deployed** application on **AWS** (or local stack if demoing in class).

- **Secure registration and login** (including MFA path where applicable).  
- **Create a list**, **add items**, and attach a **note**, **link**, or **file** where the environment allows uploads.  
- **Explore** page: search, sort, and visibility behavior; **dashboard** analytics where data exists.  
- **Optional:** quick peek at **Swagger** (`/api-docs`) or **health** (`/up`) to show API availability behind CloudFront.

*(Align narration with **`DEMO.md`** sections 7–8 for UI steps and test accounts.)*

---

## Slide 10 — Technical Lessons Learned

- **Schema-first design** paid off: normalizing early avoided a class of integration defects between API, UI, and reports.  
- **Security and routing** behave differently in **production**: **HTTPS**, **same-origin API URLs**, and **CloudFront path behaviors** exposed issues that localhost masks—planning **CORS**, **TLS**, and **cache invalidation** early saves rework.  
- **Containers:** refreshing a running service requires more than **`docker pull`**; aligning scripts and docs prevented “new image, old behavior” confusion.  
- **Caching and throttling:** production **Solid Cache** and rate limits must have matching **migrations**; missing tables surfaced as **500s** until migrations were run—now documented.

---

## Slide 11 — Project Management Lessons Learned

- **Phased delivery** worked: a stable **Rails API** and contract (Swagger) before deep **React** work reduced thrash at integration.  
- **Strict scope** and parking non-critical ideas into a **defer list** helped hit **deployment** and documentation milestones.  
- **Single runbook** (**DEMO.md**) reduced duplicate instructions and onboarding friction for “how do I start BE/FE locally vs. AWS?”

---

## Slide 12 — Conclusion

- **CatalogIt** is **deployed**, **documented**, and **aligned** with course security and architecture goals.  
- Documentation is **organized for handoff**: demo commands, deployment architecture, operations notes, and **git hygiene** for secrets.  
- Thank you for your time and guidance throughout the semester.

---

### Reference (optional speaker note)

**Wang, M.** (2026). *CatalogIt: A personalized cataloging and rating platform* [Course project]. CS 701 — Special Projects in Computer Science II.

Adjust name/initials to match your submission guidelines.
