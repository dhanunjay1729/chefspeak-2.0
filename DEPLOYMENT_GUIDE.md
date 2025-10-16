# ChefSpeak Deployment Guide

This guide will help you deploy ChefSpeak to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deploy Frontend](#deploy-frontend)
4. [Deploy TTS Server](#deploy-tts-server)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All API keys ready (Firebase, OpenAI, Unsplash)
- [ ] Firebase project created and configured
- [ ] Google Cloud project with Text-to-Speech API enabled
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (provided by hosting platforms)
- [ ] Firestore security rules configured
- [ ] Firebase Authentication enabled

---

## Environment Setup

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see SECURITY.md)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and copy the config object

### 2. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Set up billing (required for API access)
4. **Important:** Add usage limits to prevent unexpected charges

### 3. Unsplash Setup (Optional)

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy your Access Key

### 4. Google Cloud TTS Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Text-to-Speech API
4. Create a service account
5. Download the JSON key file
6. Keep this file secure (never commit it)

---

## Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   Go to your project settings on Vercel dashboard and add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_OPENAI_API_KEY`
   - `VITE_UNSPLASH_API_KEY`

5. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Option B: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variables:**
   ```bash
   netlify env:set VITE_FIREBASE_API_KEY "your-key"
   netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your-domain"
   # ... repeat for all variables
   ```

5. **Redeploy:**
   ```bash
   netlify deploy --prod
   ```

### Option C: Manual Build & Deploy

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to your static hosting provider:
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - GitHub Pages

---

## Deploy TTS Server

The TTS server needs to run as a separate Node.js backend.

### Option A: Deploy to Railway

1. Go to [Railway.app](https://railway.app/)
2. Create a new project
3. Connect your GitHub repository
4. Add a new service and select `ttsServer.js` as the entry point
5. Add environment variables (if needed)
6. Upload the `google-tts-key.json` as a secret
7. Deploy

### Option B: Deploy to Render

1. Go to [Render.com](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `node ttsServer.js`
   - Environment: Node
5. Add environment variables
6. Upload `google-tts-key.json` as a secret file
7. Deploy

### Option C: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-tts-server`
4. Set buildpack: `heroku buildpacks:set heroku/nodejs`
5. Add `google-tts-key.json` as a config var
6. Deploy: `git push heroku main`

### Update Frontend TTS URL

After deploying the TTS server, update the frontend code:

In `src/services/ttsService.js`, change:
```javascript
constructor(baseUrl = "http://localhost:3001") {
```

To:
```javascript
constructor(baseUrl = "https://your-tts-server.railway.app") {
```

Or use an environment variable:
```javascript
constructor(baseUrl = import.meta.env.VITE_TTS_SERVER_URL || "http://localhost:3001") {
```

---

## Post-Deployment

### 1. Update CORS Configuration

In `ttsServer.js`, update CORS to allow your frontend domain:

```javascript
app.use(cors({
  origin: ['https://your-chefspeak.vercel.app'],
  credentials: true
}));
```

### 2. Configure Firebase Security Rules

Apply the security rules from `SECURITY.md` to your Firestore database.

### 3. Test All Features

- [ ] User registration
- [ ] User login
- [ ] Recipe generation
- [ ] Voice navigation (in Chrome)
- [ ] TTS narration
- [ ] Favorites functionality
- [ ] Profile management
- [ ] Recipe history

### 4. Set Up Custom Domain (Optional)

#### Vercel:
1. Go to Project Settings > Domains
2. Add your domain
3. Follow DNS configuration instructions

#### Netlify:
1. Go to Domain Settings
2. Add custom domain
3. Configure DNS

---

## Monitoring & Maintenance

### 1. Set Up Error Tracking

Consider integrating:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay
- [Google Analytics](https://analytics.google.com/) for user analytics

### 2. Monitor API Usage

- OpenAI: Check usage in OpenAI dashboard, set up alerts
- Firebase: Monitor Firestore reads/writes in Firebase Console
- Google Cloud: Monitor TTS API usage in Google Cloud Console

### 3. Set Up Alerts

- API quota alerts
- Error rate alerts
- Performance degradation alerts

### 4. Regular Maintenance

- Update dependencies monthly: `npm update`
- Review security advisories: `npm audit`
- Monitor user feedback and bug reports
- Review and optimize Firestore queries
- Check and rotate API keys periodically

### 5. Performance Optimization

- Use a CDN for static assets
- Enable gzip/brotli compression
- Implement code splitting
- Optimize images
- Use lazy loading for components
- Monitor Core Web Vitals

### 6. Backup Strategy

- Regular Firestore backups (Firebase offers automatic backups)
- Export user data periodically
- Keep backup of environment variables

---

## Troubleshooting

### Common Issues

1. **Firebase Authentication Not Working**
   - Check authorized domains in Firebase Console
   - Verify API keys are correct
   - Ensure Authentication is enabled

2. **TTS Not Working**
   - Verify TTS server is running
   - Check CORS configuration
   - Ensure Google Cloud credentials are valid
   - Verify TTS API is enabled

3. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear build cache: `rm -rf dist`
   - Check Node.js version (should be 18+)

4. **Environment Variables Not Working**
   - Ensure variables start with `VITE_` for Vite
   - Redeploy after adding variables
   - Check for typos in variable names

---

## Cost Estimation

### Monthly Costs (estimated for moderate usage):

- **Vercel/Netlify:** Free tier or ~$20/month for Pro
- **Firebase:** Free tier or ~$25-50/month (depends on usage)
- **OpenAI API:** ~$10-100/month (depends heavily on usage)
- **Google Cloud TTS:** ~$4-20/month (depends on usage)
- **Backend Hosting (Railway/Render):** Free tier or ~$5-10/month
- **Domain:** ~$10-15/year

**Total:** $15-$200/month depending on usage and features

### Cost Optimization Tips

1. Implement request caching
2. Rate limit API calls
3. Use Firebase free tier wisely
4. Monitor and set usage alerts
5. Optimize Firestore queries to minimize reads

---

## Support

If you encounter issues:
1. Check the [GitHub Issues](https://github.com/dhanunjay1729/chefspeak-2.0/issues)
2. Review [SECURITY.md](SECURITY.md) for security-related issues
3. Consult [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

---

**Good luck with your deployment! 🚀**
