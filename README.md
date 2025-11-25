# Dear Distance 

A personal, intimate letter-sharing website for long-distance partners. Create beautiful letters with photos, voice recordings, videos, and music. Build shared memories, journal together, and count down to special moments—no matter the distance.

##  Features

###  Rich Letter Editor
- Rich text editing with TipTap (bold, italic, headings, lists, quotes)
- Insert photos, videos, and audio recordings
- Embed music from Spotify and SoundCloud
- Handwriting-style fonts for that personal touch
- Beautiful, paper-like backgrounds

###  Security & Privacy
- End-to-end encryption for all letter content
- Password protection for individual letters
- Private and unlisted visibility options
- Scheduled letter reveals (unlock at a specific date/time)
- Secure authentication with Supabase

###  Letter Experience
- Envelope-opening animation when viewing letters
- Confetti and hearts animations for special moments
- Read-aloud mode with text-to-speech
- Smooth, emotional animations with Framer Motion

###  Shared Journal
- Write back and forth with your partner
- Thread-style conversation view
- Real-time updates
- Perfect for daily thoughts and feelings

###  Memory Gallery
- Shared timeline of photos, quotes, and moments
- Tag memories for easy organization
- Date-based organization
- Beautiful card-based layout

###  Countdown Timers
- Track special dates together (reunions, anniversaries, etc.)
- Real-time countdown display
- Multiple countdowns support
- Beautiful gradient cards

###  Themes
- **Minimal**: Clean and modern
- **Vintage Paper**: Warm, nostalgic paper feel
- **Scrapbook**: Cozy scrapbook aesthetic
- **Storybook**: Elegant storybook style

##  Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Custom CSS
- **Animations**: Framer Motion
- **Rich Text Editor**: TipTap
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for media files)
- **Authentication**: Supabase Auth
- **Encryption**: CryptoJS (AES encryption)

##  Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- npm or yarn package manager

##  Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd letters

# Install dependencies
npm install
# or
yarn install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your keys
3. Go to SQL Editor and run the schema file:

```sql
-- Copy and paste the contents of database/schema.sql
```

4. Set up Storage:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `dear-distance-media`
   - Set it to public (for now, or configure RLS policies)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from env.example
cp env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Generate a random 32-byte encryption key
# You can use: openssl rand -base64 32
ENCRYPTION_KEY=your_32_byte_encryption_key_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Generate a strong encryption key for production:
```bash
openssl rand -base64 32
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Project Structure

```
letters/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── letters/           # Letter pages
│   ├── journal/           # Shared journal
│   ├── memories/          # Memory gallery
│   ├── countdowns/        # Countdown timers
│   ├── settings/          # User settings
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── LetterEditor.tsx   # Rich text editor
│   └── CountdownTimer.tsx # Countdown component
├── lib/                   # Utility functions
│   ├── supabase/          # Supabase client
│   └── encryption.ts      # Encryption utilities
├── database/              # Database schema
│   └── schema.sql         # SQL schema file
└── README.md              # This file
```

##  Security Notes

- **Encryption**: All letter content is encrypted using AES encryption before storage
- **Password Protection**: Letter passwords are hashed using SHA-256
- **Authentication**: Uses Supabase Auth for secure user authentication
- **Row Level Security**: Database policies ensure users can only access their own data

**Important**: In production, ensure:
- Your `ENCRYPTION_KEY` is kept secret and never committed to git
- Use environment variables for all sensitive data
- Enable HTTPS
- Review and test RLS policies
- Consider using Supabase Vault for managing encryption keys

##  Features Walkthrough

### Creating a Letter

1. Click "Write a Letter" from the dashboard
2. Enter a title and recipient email (optional)
3. Write your letter using the rich text editor
4. Add photos, videos, voice recordings, or music
5. Set visibility, password protection, or schedule reveal
6. Save your letter

### Viewing a Letter

1. Click on a letter from your letters list
2. If password protected, enter the password
3. Watch the envelope animation
4. Read your letter with beautiful formatting
5. Use the read-aloud feature to hear it spoken

### Shared Journal

1. Connect with your partner in Settings
2. Go to Shared Journal
3. Write entries that both of you can see
4. Create a conversation thread together

### Memory Gallery

1. Add memories with photos, quotes, and descriptions
2. Tag them for easy organization
3. View your shared timeline together
4. Relive special moments

### Countdowns

1. Create a countdown to a special date
2. Watch it count down in real-time
3. Celebrate when it reaches zero!

##  Customization

### Themes

Themes are defined in `app/globals.css` and can be customized:

```css
.theme-vintage {
  --bg-primary: #f5f1e8;
  --bg-secondary: #ede8dc;
  --text-primary: #2c1810;
  /* ... */
}
```

### Fonts

Handwriting fonts are loaded from Google Fonts. You can customize them in `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap');
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

The app can be deployed anywhere Next.js is supported:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

**Note**: Make sure to set up environment variables in your deployment platform.

##  Contributing

This is a personal project, but suggestions and improvements are welcome!

##  License

See LICENSE file for details.

##  Acknowledgments

Built with love for long-distance couples everywhere. 

---

**Made with love for keeping connections strong across any distance**
