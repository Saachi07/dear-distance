# Quick Start Guide - Running Locally

Follow these steps to get the application running on your local machine.

## Step 1: Install Dependencies

First, make sure you have Node.js 18+ installed. Then install the project dependencies:

```bash
npm install
```

or if you prefer yarn:

```bash
yarn install
```

## Step 2: Set Up Supabase

### A. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details (name, database password, region)
4. Wait for the project to be created

### B. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - keep this secret!)

### C. Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `database/schema.sql` from this project
4. Copy and paste the entire contents into the SQL Editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. Verify tables were created by going to **Table Editor** - you should see:
   - profiles
   - letters
   - media
   - journal_entries
   - memories
   - stamps
   - countdowns

### D. Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name it: `letters-media`
4. Check **"Public bucket"** to make it public
5. Click "Create bucket"

## Step 3: Configure Environment Variables

1. Make sure you have a `.env.local` file in the root directory (it should already exist)
2. Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Generate an encryption key (run this in terminal):
# openssl rand -base64 32
ENCRYPTION_KEY=paste-your-generated-key-here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To generate the encryption key**, run in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `ENCRYPTION_KEY` value.

**Windows (PowerShell) alternative:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Step 4: Run the Development Server

```bash
npm run dev
```

or

```bash
yarn dev
```

The application will start at **http://localhost:3000**

## Step 5: Test the Application

1. Open http://localhost:3000 in your browser
2. Click "Get Started" to create your first account
3. Sign up with your email and password
4. You'll be redirected to the dashboard

### First Time Setup:

1. **Create Your Profile**:
   - Go to Settings (gear icon)
   - Update your display name
   - Save settings

2. **Connect with Your Partner** (optional):
   - Have your partner create an account too
   - In Settings, enter your partner's email in "Partner Email" field
   - Both partners should do this to link accounts

3. **Create Your First Letter**:
   - Click "Write a Letter" from dashboard
   - Add a title and write some content
   - Try adding a photo or voice recording
   - Save the letter
   - View it from the "My Letters" page

## Troubleshooting

### "Failed to connect to Supabase"
- Check that your `.env.local` file has the correct Supabase URL and keys
- Make sure the file is in the root directory
- Restart the dev server after changing `.env.local`

### "Failed to upload media"
- Verify the `letters-media` bucket exists in Supabase Storage
- Check that the bucket is set to "Public"
- Check browser console for specific error messages

### "Failed to decrypt content"
- Make sure your `ENCRYPTION_KEY` is set correctly
- Don't change this key once you've created letters (you'll lose access to them)
- The key should be a base64-encoded string

### "Cannot find module" errors
- Delete `node_modules` folder and `.next` folder
- Run `npm install` again
- Restart your dev server

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

## What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Check [SETUP.md](SETUP.md) for advanced configuration
- Start writing letters and exploring features!

---

**Need help?** Check the console for error messages and make sure all environment variables are set correctly.


