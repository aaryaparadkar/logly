# Custom Domains & Export

Logly supports exporting your changelog to host it on your own domain. However, due to platform limitations (Vercel), the setup requires some manual configuration.

## Current Approach: Export & Host

Since Vercel doesn't support automated multi-tenant custom domains without manual project configuration, the recommended approach is to **export your changelog** and host it yourself.

### How to Export

1. Go to your changelog page: `/r/[owner]/[repo]/settings`
2. Click the **Export** button
3. Choose your preferred format:
   - **Static HTML** - Ready to deploy anywhere
   - **JSON** - For programmatic use

### Hosting the Export

#### Option 1: GitHub Pages

1. Create a new repository: `yourusername/your-repo-name.github.io`
2. Add the exported files to the `docs/` folder
3. Push to GitHub
4. Enable GitHub Pages in repository settings
5. Your changelog is live at: `https://yourusername.github.io/your-repo-name.github.io/`

#### Option 2: Cloudflare Pages

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create a new Pages project
3. Connect to your GitHub repository
4. Build settings:
   - Build command: (leave empty for static HTML)
   - Output directory: (where your exported files are)
5. Deploy
6. Add custom domain in Cloudflare settings

#### Option 3: Any Static Host

Upload the exported files to any static hosting provider:
- Netlify
- Vercel (manual)
- AWS S3 + CloudFront
- Google Cloud Storage

### Why Not Direct Custom Domains?

Vercel (the current deployment platform) requires each custom domain to be manually attached to the project. For a multi-tenant public service, this would require:
1. Either paid Vercel Enterprise (unlimited domains)
2. Or manual domain attachment per user

This isn't feasible for an open-source/public deployment.

### Future Improvements

If you need true custom domain support:

1. **Use Cloudflare Workers** - Route all domains through Cloudflare, no Vercel domain attachment needed
2. **Use a different platform** - Platforms like Coolify or self-hosted solutions support unlimited domains natively
3. **Wildcard on your own domain** - Add `*.yourdomain.com` in Vercel once; works only for subdomains of your domain

## Quick Export Guide

```bash
# Or via API
curl -X POST "https://api.logly.app/export/{owner}/{repo}/html" -o changelog.html
```

The exported HTML is self-contained and works on any static hosting.