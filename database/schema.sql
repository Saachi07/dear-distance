-- Dear Distance core schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles most of this, but we add profile data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  theme_preference TEXT DEFAULT 'minimal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Letters table
CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_encrypted TEXT NOT NULL, -- Encrypted letter content
  password_hash TEXT, -- For password-protected letters
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted')),
  scheduled_reveal_at TIMESTAMP WITH TIME ZONE,
  is_unlocked BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  letter_type TEXT DEFAULT 'regular' CHECK (letter_type IN ('regular', 'open_when')),
  open_when_condition TEXT, -- e.g., "sad", "missing me", "want to hug me"
  puzzle_type TEXT CHECK (puzzle_type IN ('riddle', 'math', 'word')), -- puzzle type
  puzzle_question TEXT,
  puzzle_answer_hash TEXT, -- Hashed answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Journal entries (shared thread)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Memories (gallery items)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  quote TEXT,
  memory_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Media table (photos, videos, audio) - must be created after letters, journal_entries, and memories
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'audio', 'music_embed')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB, -- Store additional info like duration, dimensions, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Virtual stamps/tokens
CREATE TABLE IF NOT EXISTS stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'milestone', 'distance', 'anniversary', 'custom'
  label TEXT NOT NULL,
  icon TEXT, -- Icon name or emoji
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Countdown timers
CREATE TABLE IF NOT EXISTS countdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Time capsules
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_encrypted TEXT NOT NULL,
  open_date DATE NOT NULL,
  is_opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  media_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Activities (notification feed)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('letter_sent', 'letter_opened', 'memory_added', 'journal_entry', 'time_capsule_created')),
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_letters_sender ON letters(sender_id);
CREATE INDEX IF NOT EXISTS idx_letters_recipient ON letters(recipient_id);
CREATE INDEX IF NOT EXISTS idx_letters_visibility ON letters(visibility);
CREATE INDEX IF NOT EXISTS idx_letters_scheduled ON letters(scheduled_reveal_at);
CREATE INDEX IF NOT EXISTS idx_media_letter ON media(letter_id);
CREATE INDEX IF NOT EXISTS idx_media_journal ON media(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_media_memory ON media(memory_id);
CREATE INDEX IF NOT EXISTS idx_journal_author ON journal_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_journal_partner ON journal_entries(partner_id);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_partner ON memories(partner_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_user ON time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_partner ON time_capsules(partner_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_open_date ON time_capsules(open_date);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_partner ON activities(partner_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile and their partner's
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT USING (
    id IN (SELECT partner_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT id FROM profiles WHERE partner_id = auth.uid())
  );

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Letters: Users can view letters they sent or received
CREATE POLICY "Users can view own letters" ON letters
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create letters" ON letters
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own sent letters" ON letters
  FOR UPDATE USING (auth.uid() = sender_id);

-- Media: Users can view media related to their letters/journal/memories
CREATE POLICY "Users can view related media" ON media
  FOR SELECT USING (
    letter_id IN (SELECT id FROM letters WHERE sender_id = auth.uid() OR recipient_id = auth.uid())
    OR journal_entry_id IN (SELECT id FROM journal_entries WHERE author_id = auth.uid() OR partner_id = auth.uid())
    OR memory_id IN (SELECT id FROM memories WHERE user_id = auth.uid() OR partner_id = auth.uid())
  );

CREATE POLICY "Users can create media for their content" ON media
  FOR INSERT WITH CHECK (
    letter_id IN (SELECT id FROM letters WHERE sender_id = auth.uid())
    OR journal_entry_id IN (SELECT id FROM journal_entries WHERE author_id = auth.uid())
    OR memory_id IN (SELECT id FROM memories WHERE user_id = auth.uid())
  );

-- Journal entries: Both partners can view and create
CREATE POLICY "Partners can view journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = author_id OR auth.uid() = partner_id);

CREATE POLICY "Partners can create journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Memories: Both partners can view and create
CREATE POLICY "Partners can view memories" ON memories
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Partners can create memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stamps: Partners can view each other's stamps
CREATE POLICY "Partners can view stamps" ON stamps
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Partners can create stamps" ON stamps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Countdowns: Partners can view each other's countdowns
CREATE POLICY "Partners can view countdowns" ON countdowns
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Partners can create countdowns" ON countdowns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Time capsules
CREATE POLICY "Users can view own time capsules" ON time_capsules
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create time capsules" ON time_capsules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time capsules" ON time_capsules
  FOR UPDATE USING (auth.uid() = user_id);

-- Activities
CREATE POLICY "Partners can view activities" ON activities
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_display_name TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (user_id, user_email, user_display_name)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_capsules_updated_at BEFORE UPDATE ON time_capsules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
