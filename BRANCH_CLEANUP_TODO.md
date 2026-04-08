# TODO: delete remote branches (blocked by GitHub rules)

Attempting to delete remote branches failed with **GH013 repository rule violations** (“Cannot delete this branch”).

When branch deletion is allowed in GitHub rulesets/branch protection, delete these remote branches from `origin`:

- `add-swagger`
- `added-auth`
- `deployment`
- `feature/frontend-init`
- `feature/mar-2-full-tests-doc-refresh`
- `feature/mar-2-search-analytics`
- `feature/mar-9-weekly-integration`
- `fix`
- `frontend-setup`
- `midterm-demo`
- `pr/ignore-runtime-origin-deployment`
- `security-compliance-fixes`

## After rules are updated

Run:

```bash
git push origin --delete \
  add-swagger added-auth deployment \
  feature/frontend-init feature/mar-2-full-tests-doc-refresh feature/mar-2-search-analytics feature/mar-9-weekly-integration \
  fix frontend-setup midterm-demo pr/ignore-runtime-origin-deployment security-compliance-fixes
```

