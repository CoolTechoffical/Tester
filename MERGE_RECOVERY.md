# Merge Recovery Guide (Termux/GitHub)

If you see errors like:
- `SyntaxError ... package.json`
- `npm ERR! EJSONPARSE`
- `<<<<<<< HEAD` in `package.json` or `package-lock.json`

use this sequence:

```bash
# 1) Abort unfinished merge if needed
git merge --abort || git reset --merge

# 2) Re-merge the target branch
git merge main

# 3) Keep intended backend package.json and regenerate lockfile
npm run fix:package-lock

# 4) Validate conflict markers + syntax
npm test

# 5) Commit and push
git add package.json package-lock.json
git commit -m "Resolve package merge conflicts"
git push
```

If git asks for identity:
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

If push fails with password auth error, use a GitHub PAT token instead of account password.
