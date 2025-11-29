# Vercel Deployment Guide

This guide will help you deploy your Portfolio application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Your MongoDB connection string (already set up)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to your Git repository.

## Step 2: Install Vercel CLI (Optional)

You can deploy via the Vercel website or using the CLI:

```bash
npm i -g vercel
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# For production deployment
vercel --prod
```

## Step 4: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following environment variables:

### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
VITE_API_URL=https://your-project.vercel.app/api
NODE_ENV=production
```

### Important Notes:

- **MONGODB_URI**: Your MongoDB Atlas connection string
- **VITE_API_URL**: Your Vercel deployment URL (will be something like `https://your-project.vercel.app/api`)
  - ⚠️ **Important**: You'll need to update this after your first deployment with the actual URL
  - The format should be: `https://your-project-name.vercel.app/api`
- **NODE_ENV**: Set to `production`

### Setting Environment Variables:

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Select all (Production, Preview, Development)
4. Repeat for `VITE_API_URL` and `NODE_ENV`

## Step 5: Update MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (or add Vercel's IP ranges)
5. Save the changes

## Step 6: Redeploy After Setting Environment Variables

After setting environment variables, you need to redeploy:

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **Redeploy**

Or trigger a new deployment by pushing a commit:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## Step 7: Update VITE_API_URL

After your first deployment:

1. Copy your deployment URL (e.g., `https://your-project.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://your-project.vercel.app/api`
4. Redeploy your application

## Project Structure for Vercel

The project is configured with:

- **`vercel.json`**: Vercel configuration file
- **`api/index.js`**: Serverless function wrapper for Express
- **Frontend**: Built with Vite, output to `dist/`
- **Backend**: Express server running as serverless functions

## API Routes

Your API will be available at:
- `https://your-project.vercel.app/api/portfolio` (GET, POST, DELETE)
- `https://your-project.vercel.app/api/health` (Health check)

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (Vercel uses Node 18.x by default)

### API Not Working

1. Check environment variables are set correctly
2. Verify `VITE_API_URL` matches your deployment URL
3. Check MongoDB connection string is correct
4. Ensure MongoDB Atlas allows connections from anywhere

### MongoDB Connection Issues

1. Verify `MONGODB_URI` is set correctly in Vercel
2. Check MongoDB Atlas Network Access settings
3. Ensure your MongoDB user has proper permissions
4. Check MongoDB Atlas logs for connection attempts

### Frontend Can't Connect to API

1. Verify `VITE_API_URL` environment variable is set
2. Check browser console for CORS errors
3. Ensure API routes are working (test `/api/health` endpoint)
4. Redeploy after updating environment variables

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `VITE_API_URL` to use your custom domain

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For other branches, it creates preview deployments.

## Monitoring

- Check deployment logs in Vercel dashboard
- Monitor API usage in Vercel Analytics
- Check MongoDB Atlas for database metrics

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review MongoDB Atlas connection logs
3. Verify all environment variables are set
4. Check the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)

