# CatalogIt - Complete Setup Instructions

## IMPORTANT: Follow These Steps in Order

### Step 1: Open Cursor in the Correct Folder

**Close Cursor completely, then:**

1. Open Finder
2. Navigate to: `/Users/Jelly1/Documents/my-app/catalogIt/catalog-it`
3. Right-click on the `catalog-it` folder
4. Select "Open with Cursor"

**OR from terminal:**
```bash
cd /Users/Jelly1/Documents/my-app/catalogIt/catalog-it
cursor .
```

This sets your workspace root correctly. All terminals will now open in the `backend/` directory.

---

### Step 2: Disable RVM Interference

**Open a new terminal in Cursor** (it should now be in the backend directory).

Run this ONCE to disable RVM auto-switching:
```bash
echo "rvm_project_rvmrc=0" >> ~/.rvmrc
```

Then close and reopen the terminal.

---

### Step 3: Start Rails Server

In the terminal (should be in backend/ directory):

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

- [ ] Cursor workspace is `catalog-it/` (check bottom left of Cursor)
- [ ] New terminals open in `backend/` directory
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
