# Deploying to Render

1. Push your repository to GitHub (or connect Git provider).
2. In Render, create a new **Web Service** and connect to this repository.
3. Set Build Command: `npm ci && npm run build` and Start Command: `npm run start`.
4. Add environment variables if needed (e.g., DB connection strings). Use the **Environment** > **Secret** section in Render to store sensitive values.
5. Enable branch protections on GitHub (see below) and use `.github/CODEOWNERS` to require review for critical files.

Note: The repository can include a `render.yaml` manifest to configure services programmatically (see `render.yaml` at repo root). Render will respect the build/start commands in the manifest. Use `npm ci` in CI and render builds to ensure reproducible installs.
