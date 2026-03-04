# Two-way GitHub sync

This project is set up to sync with [https://github.com/packetsoutllc/po-onlineadmission](https://github.com/packetsoutllc/po-onlineadmission).

## One-time setup

1. **Install Git** (if needed): [git-scm.com](https://git-scm.com/) and ensure `git` is in your PATH.

2. **Set your GitHub token** (only in this terminal session; it is not saved in the repo):
   ```powershell
   $env:GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"
   ```

3. **Run the setup script** from the project root:
   ```powershell
   npm run setup:github
   ```
   This will:
   - Initialize a git repo if needed
   - Add the remote `origin` using your token (stored only in local `.git/config`)
   - Install a **post-commit hook** that automatically pushes after every commit

4. **First sync with existing repo** (if the repo already has commits):
   ```powershell
   git fetch origin
   git branch -M main
   git reset --soft origin/main
   ```
   Or if you prefer to start fresh and overwrite the remote (use with care):
   ```powershell
   git add -A
   git commit -m "chore: initial sync"
   git push -u origin main --force
   ```

## Daily use (2-way sync)

| You edit here (Cursor) | You edit elsewhere (other app / GitHub web) |
|------------------------|---------------------------------------------|
| **Pull latest first:** `npm run sync:in` | — |
| **Commit as usual:** `git add -A` then `git commit -m "your message"` | — |
| **Push:** runs **automatically** after each commit (post-commit hook) | — |
| — | **Get changes here:** run `npm run sync:in` when you open the project |

**One-shot “push everything” without a separate commit message:**
```powershell
npm run sync:out
```
This stages all changes, commits with message `chore: sync to GitHub`, and pushes.

## Security

- Your token is only stored in **local** `.git/config` (never committed).
- **Rotate your token** if you shared it anywhere (e.g. in chat). Create a new one at: GitHub → Settings → Developer settings → Personal access tokens, then run setup again with `$env:GITHUB_TOKEN = "new_token"` and `npm run setup:github`.
