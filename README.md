# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

# Library Hub

React + TypeScript library management prototype (Vite).

This project stores demo data in browser localStorage and is intended for local development and testing.

Quick setup
-----------

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Open http://localhost:8080 (or the port Vite selects).

Push to GitHub
--------------

Option A — with GitHub CLI (`gh`):

```bash
# create and push repository in one step
gh repo create <your-username>/<repo-name> --public --source=. --remote=origin --push
```

Option B — manual (create an empty repo on github.com):

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Notes
-----
- If you want GitHub Pages hosting, set `homepage` in `package.json` and set `vite` base or use `VITE_BASE_URL` at build time.
- Data is stored in localStorage keys such as `lms_users`, `lms_books`, and `lms_loans` — these are excluded in `.gitignore`.

If you'd like, I can attempt to create the GitHub repo for you using the GitHub CLI (`gh`).

