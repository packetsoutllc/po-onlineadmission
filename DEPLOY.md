# Deploy live while you keep developing

Your app is set up to deploy to **Vercel** (free tier). The live site updates when you push to your repo; you can keep working locally.

## One-time setup

1. **Push your code to GitHub** (if you haven’t):
   ```bash
   git add .
   git commit -m "Prepare for deploy"
   git push origin main
   ```
   (Use your branch name instead of `main` if different.)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
   - Click **Add New… → Project** and **Import** your repo `PO-Admission-System`.
   - Leave **Build Command** as `npm run build` and **Output Directory** as `dist`.
   - Click **Deploy**.

3. **Environment variables** (if your app needs them, e.g. `GEMINI_API_KEY`):
   - In the Vercel project: **Settings → Environment Variables**.
   - Add the same names/values you use in `.env` locally.

## After setup

- **Live URL**: Vercel gives you a URL like `https://your-project.vercel.app`.
- **Update live**: Push to your connected branch (e.g. `main`); Vercel will build and deploy automatically.
- **Keep developing**: Run `npm run dev` locally; your changes stay on your machine until you push.

## Optional: custom domain

In the Vercel project: **Settings → Domains** and add your domain.
