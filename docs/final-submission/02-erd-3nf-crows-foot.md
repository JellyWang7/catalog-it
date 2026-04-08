# E-R Diagram (3NF, Crow’s Foot) — how to generate + what to include

## What to submit

- A **Crow’s Foot ERD** showing the database in **3NF**.
- Screenshots from a tool like **SQL Developer**.
- If using a “pre-packaged” DB, still include the ERD (your DB is app-specific and includes Rails tables).

## Your project’s core relational entities

From `backend/db/schema.rb`, the main application tables are:

- `users`
- `lists`
- `items`
- `comments`
- `attachments`
- junction tables: `list_likes`, `item_likes`

Rails/infra tables also present:

- Active Storage: `active_storage_blobs`, `active_storage_attachments`, `active_storage_variant_records`
- Solid Cache: `solid_cache_entries`

> Note: Solid Queue tables are defined in `backend/db/queue_schema.rb` and may be in a separate “queue” DB configuration. Include them only if your instructor expects background-job storage shown in the ERD.

## Crow’s Foot relationships (high level)

- **User (1) → (N) List**: `lists.user_id`
- **List (1) → (N) Item**: `items.list_id`
- **List (1) → (N) Comment**: `comments.list_id`
- **User (1) → (N) Comment**: `comments.user_id`
- **User (N) ↔ (N) List** via **ListLike**: unique `(user_id, list_id)`
- **User (N) ↔ (N) Item** via **ItemLike**: unique `(user_id, item_id)`
- **Attachment** belongs to **User** and polymorphically to a parent (`attachable_type`, `attachable_id`) which may be `List` or `Item`

## How to create the ERD in SQL Developer (steps)

1. Open **SQL Developer**.
2. Create a connection to your **RDS PostgreSQL** (or to a local copy if required by your course).
   - Host: your RDS endpoint
   - Port: 5432
   - Service/database name: `catalogit_production` (or your environment)
   - Username/password: your DB credentials
3. After connecting, expand the schema and confirm tables exist.
4. Use SQL Developer’s **Data Modeler** to **Import Data Dictionary**:
   - Tools → Data Modeler → Import → Data Dictionary
   - Select your connection and schema
   - Choose tables to include (at minimum: the core app tables)
5. Generate the relational model diagram and set notation to **Crow’s Foot**.
6. Arrange entities so relationships are readable and not overlapping.
7. Take screenshots:
   - full ERD overview
   - zoomed-in screenshot showing keys/relationships clearly

## Screenshot checklist

Place screenshots in `docs/final-submission/assets/`:

- `erd-overview.png`
- `erd-keys-relationships.png`

In your submission, make sure the screenshots show:

- table names
- primary keys (PK)
- foreign keys (FK)
- crow’s foot cardinality (1-to-many, many-to-many via junction tables)

## 3NF statement (pasteable)

This schema is in **Third Normal Form (3NF)**:

- Each table stores facts about a single entity (e.g. users, lists, items).
- Many-to-many relationships are decomposed into junction tables (`list_likes`, `item_likes`) rather than repeated groups.
- Non-key attributes depend on the key, the whole key, and nothing but the key.

## Optional: include a clean “core ERD only” view

If your instructor prefers a simplified ERD, create a second diagram that includes only:

`users`, `lists`, `items`, `comments`, `attachments`, `list_likes`, `item_likes`

and exclude Rails internal tables (Active Storage / cache), but mention them in a short note.

