# GitHub Pages Deployment & User Management Setup

This guide will help you set up MovieMadness on GitHub Pages with user management features.

## Prerequisites

1. A GitHub account
2. A Supabase account (free tier works)
3. A TMDB API key (free from https://www.themoviedb.org/)

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: MovieMadness (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (2-3 minutes)

### 1.2 Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `movie-man-view/supabase-setup.sql`
4. Click **Run** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

### 1.3 Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (this is your `REACT_APP_SUPABASE_URL`)
   - **anon/public key** (this is your `REACT_APP_SUPABASE_ANON_KEY`)

### 1.4 Set Up Your Admin Account

1. First, deploy the app (or run locally)
2. Sign up with your admin email through the app
3. Go back to Supabase SQL Editor
4. Run this query (replace with your email):
   ```sql
   UPDATE contributors 
   SET is_admin = TRUE, is_approved = TRUE 
   WHERE email = 'your-admin-email@example.com';
   ```
5. Sign out and sign back in - you should now see the "Admin" link in the navbar

### 1.5 API Keys (Optional)

The `api_keys` table in the database is optional and included for potential future use. You can skip this step entirely.

## Step 2: Set Up GitHub Repository

### 2.1 Create Repository

1. On GitHub, click **New repository**
2. Name it (e.g., `MovieMadness`)
3. Make it **Public** (required for free GitHub Pages)
4. **Don't** initialize with README (if you already have code)
5. Click **Create repository**

### 2.2 Push Your Code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 3: Configure GitHub Pages

### 3.1 Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. The workflow will automatically deploy on push to `main`

### 3.2 Add Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

   **REACT_APP_SUPABASE_URL**
   - Value: Your Supabase Project URL

   **REACT_APP_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key

   **REACT_APP_TMDB_API_KEY**
   - Value: Your TMDB API key

### 3.3 Trigger Deployment

1. The workflow will run automatically on push to `main`
2. Or manually trigger: **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**
3. Wait for deployment to complete (2-5 minutes)
4. Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Step 4: Local Development Setup

### 4.1 Install Dependencies

```bash
cd movie-man-view
npm install
```

### 4.2 Create Environment File

Create `movie-man-view/.env`:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
```

### 4.3 Run Locally

```bash
npm start
```

The app will open at http://localhost:3000

## Step 5: How the Contributors Program Works

### For Public Users:
- Can browse movies and TV shows
- See trailers only (YouTube embeds)
- Cannot access streaming features
- Cannot see torrent download options

### For Contributors (After Admin Approval):
- Full access to streaming content
- Can switch between streaming sources
- Access to torrent downloads
- See "⭐" badge in navbar

### For Admins:
- All contributor features
- Access to `/admin` route
- Can approve/reject contributor applications
- Can revoke contributor access

## Security Features

1. **Row Level Security (RLS)**: Supabase RLS ensures users can only access their own data
2. **Access Control**: Only approved users can see content URLs
3. **Client-Side Checks**: UI hides features from non-approved users
4. **Server-Side Validation**: Supabase policies prevent unauthorized access even if someone bypasses client checks

## Troubleshooting

### Deployment Issues

**Build fails:**
- Check that all secrets are set correctly
- Verify environment variable names match exactly
- Check GitHub Actions logs for specific errors

**Site shows 404:**
- Make sure GitHub Pages is enabled
- Check that the workflow completed successfully
- Verify the repository is public (for free tier)

### Authentication Issues

**Can't sign up:**
- Check Supabase project is active
- Verify email confirmation is disabled in Supabase (Settings → Authentication → Email Auth)
- Check browser console for errors

**Admin panel not accessible:**
- Verify you ran the SQL update to set `is_admin = TRUE`
- Sign out and sign back in
- Check Supabase contributors table to verify your account

### Streaming Not Working

**Trailers not showing:**
- Check TMDB API key is correct
- Some movies/shows may not have trailers
- Check browser console for API errors

**Streaming not working for contributors:**
- Verify user is approved in Supabase (`is_approved = TRUE`)
- Check that streaming URLs are accessible
- Some content may not be available on streaming services

## Next Steps

1. Customize the UI/UX to your liking
2. Add more streaming sources if needed
3. Implement additional security measures
4. Set up custom domain (optional)
5. Add analytics (optional)

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Verify all environment variables are set
4. Review GitHub Actions logs

---

**Important Security Notes:**

- Never commit `.env` files to Git
- Keep your Supabase service role key secret (never expose in client code)
- Regularly review approved contributors
- Consider implementing rate limiting for API calls
- Monitor Supabase usage to avoid exceeding free tier limits
