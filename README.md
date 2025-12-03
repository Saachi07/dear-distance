# Dear Distance 💌

A personal, intimate digital space for long-distance partners to share letters, memories, and moments—no matter the distance.

---

## Features Overview

### Interactive Letters
* **Encrypted Content:** All letter content is secured with **AES End-to-End Encryption**.
* **Rich Media Editor:** Create beautiful letters with rich text editing (TipTap), photos, videos, audio recordings, and music embeds (Spotify & SoundCloud).
* **Interactive Reveals:** Features an envelope-opening animation, with optional password or puzzle/riddle protection, and confetti animations on open.
* **Scheduled Delivery:** Letters can be scheduled to unlock at a specific date and time.

### Shared Hub
* **Shared Journal:** A thread-style space for daily thoughts and back-and-forth conversations with your partner.
* **Memory Gallery:** A shared timeline of photos, quotes, and moments, organized by date.
* **Countdown Timers:** Track reunions, anniversaries, and other special dates with a real-time display.
* **Themes:** Choose from multiple aesthetics: **Minimal**, **Vintage Paper**, **Scrapbook**, and **Storybook**.

---

##  Tech Stack

* **Frontend:** Next.js 14, React, TypeScript.
* **Styling/UI:** Tailwind CSS, Custom CSS, Framer Motion for animations, TipTap (Rich Text Editor).
* **Backend/Database:** Supabase (PostgreSQL).
* **Auth/Storage:** Supabase Auth & Storage (for media files).
* **Security:** CryptoJS (AES encryption).

---

##  Local Setup Guide

Follow these steps to get the application running on your local machine.

### Prerequisites
Before starting, ensure you have:
* **Node.js 18+** installed.
* A **Supabase** account.
* `npm` or `yarn` package manager.

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd dear-distance

# Install dependencies
npm install
# or
yarn install
````

### Step 2: Configure Supabase Database and Storage

1.  **Create Project:** Create a new project at [supabase.com](https://supabase.com).
2.  **Run Schema:** Go to the **SQL Editor** in your dashboard. Copy the entire contents of the local `database/schema.sql` file and run it to set up all tables and RLS policies.
3.  **Setup Storage:** In the Supabase **Storage** section, create a new **Public** bucket named `dear-distance-media` for media uploads.
4.  **Get Keys:** Retrieve your `Project URL` and API keys (anon public and service\_role) from **Project Settings \> API**.

### Step 3: Configure Environment Variables

Create a file named `.env.local` in the root directory and fill in your keys.

```env
# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Encryption Key (Must be 32 bytes base64-encoded)
# Generate using: openssl rand -base64 32
ENCRYPTION_KEY=paste-your-generated-key-here

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED=false
```

### Step 4: Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000] in your browser to begin.

-----

## 📝 Usage & Troubleshooting

### First Time Setup

1.  **Create Accounts:** Sign up with your account and have your partner sign up with theirs.
2.  **Connect Partner:** In **Settings**, enter your partner's email in the "Partner Email" field. Both partners must do this to link their accounts for shared features.

### Troubleshooting Tips

| Issue | Potential Solution |
| **"Partner email not found"** | Ensure both users have signed up and the email is entered correctly (case-insensitive if schema fixed). |
| **"Failed to decrypt content"** | Verify your `ENCRYPTION_KEY` is set correctly and has not been changed since creating the letters. |
| **"Failed to upload media"** | Confirm the `dear-distance-media` bucket exists and is set to **Public** in Supabase Storage. |
| **Authentication issues** | Clear browser cookies and ensure Supabase API keys in `.env.local` are correct. |

-----

## 🔒 License

This project is licensed under a **Proprietary License**.

**Copyright 2025 Saachi Gupta - All Rights Reserved.**

This application's source code is the confidential and proprietary information of the copyright holder. Unauthorized use, reproduction, or distribution of this source code is strictly prohibited.

```
```