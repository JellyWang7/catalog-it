# CatalogIt — first-time setup (editor + API)

Use this when you are new to the repo. For a shorter checklist, see [QUICKSTART.md](QUICKSTART.md). For the full project map, see [README.md](README.md).

## IMPORTANT: Follow these steps in order

### Step 1: Open the repo root in your editor

**Workspace root** should be the `catalog-it` folder (the one that contains `backend/` and `frontend/`).

**From terminal (VS Code / Cursor):**
```bash
cd /path/to/catalog-it
cursor .
# or: code .
```

Use **new terminals** from that workspace; you will `cd backend` or `cd frontend` as needed below.

---

### Step 2: Disable RVM Interference

**Open a new terminal** at the repo root, then:
```bash
cd backend
```

Run this ONCE to disable RVM auto-switching:
```bash
echo "rvm_project_rvmrc=0" >> ~/.rvmrc
```

Then close and reopen the terminal.

---

### Step 3: Start Rails Server

From `backend/`:

```bash
bundle exec rails server
```

You should see:
```
=> Booting Puma
=> Rails 8.1.2 application starting in development
* Listening on http://127.0.0.1:3000
```

**Leave this terminal open!** Rails must run continuously.

---

### Step 4: Test the API

Open a NEW terminal and run:
```bash
curl http://localhost:3000/api/v1/lists
```

You should see JSON data with 6 public lists.

---

## Alternative: Use the Startup Script

If `bundle exec rails server` doesn't work:

```bash
./start_server.sh
```

---

## Verification Checklist

- [ ] Editor workspace root is the `catalog-it` folder (contains `backend/` and `frontend/`)
- [ ] You can `cd backend` and run the server from there
- [ ] `bundle exec rails server` starts successfully
- [ ] API responds at http://localhost:3000/api/v1/lists
- [ ] Ready to build frontend!

---

## If You're Still Having Issues

Run these debug commands and send me the output:
```bash
pwd
which ruby
ruby --version
which bundle
bundle exec which rails
```
