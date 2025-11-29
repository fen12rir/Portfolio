# How to Set Environment Variables in Vercel

## ⚠️ Important: Environment variables must be set in Vercel Dashboard, NOT in a local .env file!

## Step-by-Step Instructions:

### 1. Go to Your Vercel Project
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click on your project: **dio-usa** (or your project name)

### 2. Navigate to Settings
1. Click on the **"Settings"** tab (top navigation)
2. Click on **"Environment Variables"** in the left sidebar

### 3. Add Required Environment Variables

Click **"Add New"** and add each of these variables:

#### Variable 1: MONGODB_URI
- **Key**: `MONGODB_URI`
- **Value**: Your MongoDB Atlas connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority`
- **Environment**: Select all three:
  - ☑️ Production
  - ☑️ Preview  
  - ☑️ Development
- Click **"Save"**

#### Variable 2: VITE_API_URL
- **Key**: `VITE_API_URL`
- **Value**: `https://dio-usa.vercel.app/api`
  - ⚠️ Replace `dio-usa` with your actual Vercel project name if different
- **Environment**: Select all three:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development
- Click **"Save"**

#### Variable 3: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Select all three:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development
- Click **"Save"**

### 4. Redeploy Your Application

After adding environment variables, you MUST redeploy:

1. Go to the **"Deployments"** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Confirm the redeploy

**OR** push a new commit to trigger automatic redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy after env vars"
git push
```

## ✅ Verify Environment Variables Are Set

1. Go to **Settings** → **Environment Variables**
2. You should see all three variables listed:
   - `MONGODB_URI`
   - `VITE_API_URL`
   - `NODE_ENV`

## 🔍 Check Your Actual Vercel URL

Your deployment URL is: `https://portfolio-8xc1ia1rm-sebs-projects-d776390b.vercel.app`

But your project might have a different production URL. Check:
1. Go to **Settings** → **Domains**
2. Look for your production domain (usually `your-project.vercel.app`)

Update `VITE_API_URL` to match your actual production URL:
- If your site is at: `https://dio-usa.vercel.app`
- Then `VITE_API_URL` should be: `https://dio-usa.vercel.app/api`

## 🐛 Troubleshooting

### Still getting 500 errors?
1. Check **Deployments** → Click on latest deployment → **Functions** tab
2. Click on the function to see detailed error logs
3. Look for MongoDB connection errors or missing environment variables

### MongoDB Connection Issues?
1. Verify `MONGODB_URI` is correct in Vercel
2. Check MongoDB Atlas → Network Access → Allow from anywhere
3. Verify MongoDB user has read/write permissions

### API URL Issues?
1. Make sure `VITE_API_URL` matches your actual Vercel deployment URL
2. Test the API directly: `https://your-project.vercel.app/api/health`
3. Should return: `{"status":"ok","timestamp":"..."}`

## 📝 Quick Checklist

- [ ] `MONGODB_URI` set in Vercel dashboard
- [ ] `VITE_API_URL` set to your actual Vercel URL + `/api`
- [ ] `NODE_ENV` set to `production`
- [ ] All variables set for Production, Preview, and Development
- [ ] Application redeployed after setting variables
- [ ] MongoDB Atlas allows connections from anywhere

