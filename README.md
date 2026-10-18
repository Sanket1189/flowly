# Flowly

Flowly is a responsive React and Vite portal with self-service planners and polished service workflow demos.

## Run locally

```bash
npm ci
npm run dev
```

Create an optional `.env` file from `.env.example` when configuring donations.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. The included workflow builds and deploys the site automatically after every push to `main`.

The build detects the repository name and sets the correct Vite base path for a project URL such as `https://username.github.io/repository/`. Direct links to app routes are also supported through the generated `404.html` fallback.

Optional repository variables can be added under **Settings → Secrets and variables → Actions → Variables**:

- `VITE_SITE_URL`: full deployment root, needed only for a custom domain
- `VITE_BASE_PATH`: set to `/` when a project site uses a custom domain
- `VITE_DONATION_UPI_ID`: UPI ID used by the support dialog
- `VITE_DONATION_URL`: hosted payment link; used instead of UPI when both exist

## Production check

```bash
npm run build
npm run preview
```
