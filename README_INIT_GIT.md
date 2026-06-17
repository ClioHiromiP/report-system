This helper initializes the repo, makes an initial commit and pushes to the configured remote using isomorphic-git.

Steps to run locally (Windows PowerShell):

1. Install dependency:

```powershell
npm install isomorphic-git@1.21.0 --no-audit --no-fund
```

2. Set environment variables (replace values):

```powershell
$env:GIT_TOKEN = 'ghp_your_personal_access_token'
$env:GIT_AUTHOR_NAME = 'Your Name'
$env:GIT_AUTHOR_EMAIL = 'you@example.com'
# optional: $env:GIT_REMOTE = 'https://github.com/ClioHiromiP/report-system'
```

3. Run the script:

```powershell
node init_git.js
```

Notes:
- The script will skip `node_modules` and `.git`.
- You need a GitHub personal access token with `repo` scope to push to the repository.
- If you prefer using the native Git CLI, run the standard sequence: `git init`, `git add .`, `git commit -m "Initial commit"`, `git branch -M main`, `git remote add origin <url>`, `git push -u origin main`.
