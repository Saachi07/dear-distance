# Detailed Setup Guide

## Supabase Storage Setup

After creating your Supabase project and running the database schema:

1. **Create Storage Bucket**:
   - Go to Storage in your Supabase dashboard
   - Click "Create a new bucket"
   - Name: `letters-media`
   - Set as **Public** (for easier access, or configure RLS policies for private access)

2. **Configure Storage Policies** (if bucket is not public):

   Run this SQL in the Supabase SQL Editor:

   ```sql
   -- Allow authenticated users to upload files
   CREATE POLICY "Users can upload media" ON storage.objects
     FOR INSERT TO authenticated
     WITH CHECK (bucket_id = 'letters-media');

   -- Allow users to view their own media and partner's media
   CREATE POLICY "Users can view related media" ON storage.objects
     FOR SELECT TO authenticated
     USING (bucket_id = 'letters-media');
   ```

## Encryption Key Generation

For production, generate a secure encryption key:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add this to your `.env.local` file as `ENCRYPTION_KEY`.

## First User Setup

1. Sign up with your first account
2. Note the email you used
3. Sign up with your partner's account using a different email
4. In Settings, both users should enter each other's email in the "Partner Email" field
5. Save settings - this will link your accounts

## Testing the Application

1. **Create a Letter**:
   - Go to Dashboard > Write a Letter
   - Add some text, maybe an image
   - Try password protection
   - Save it

2. **View a Letter**:
   - Click on the letter
   - Enter password if needed
   - Watch the envelope animation
   - Try the read-aloud feature

3. **Shared Journal**:
   - Both partners should write entries
   - See the conversation thread build up

4. **Memories**:
   - Add a memory with a photo
   - Add tags and a quote
   - View the gallery

5. **Countdowns**:
   - Create a countdown to a future date
   - Watch it count down in real-time

## Troubleshooting

### "Failed to upload media"
- Check that the `letters-media` bucket exists in Supabase Storage
- Verify the bucket is public or RLS policies are set correctly
- Check browser console for specific error messages

### "Failed to decrypt content"
- Verify your `ENCRYPTION_KEY` is set correctly
- The key should be the same for all environments
- **Warning**: Changing the encryption key will make old letters unreadable

### "Partner not found"
- Make sure both users have signed up
- Check that emails are entered correctly in Settings
- Verify the email matches exactly (case-sensitive)

### Authentication issues
- Clear browser cookies and try again
- Check Supabase dashboard > Authentication > Users to verify accounts exist
- Ensure environment variables are set correctly

### Database errors
- Verify the schema.sql was run completely
- Check Supabase dashboard > Database > Tables to see if tables exist
- Review Row Level Security policies if data isn't showing

## Production Deployment Checklist

- [ ] Generate a strong, unique `ENCRYPTION_KEY`
- [ ] Set all environment variables in deployment platform
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Review and test RLS policies
- [ ] Set up backup for Supabase database
- [ ] Configure custom domain (optional)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test all features end-to-end
- [ ] Set up automated backups for media files

## Security Recommendations

1. **Use strong passwords** for both user accounts
2. **Never commit** `.env.local` or `.env` files to git
3. **Rotate encryption keys** periodically (requires re-encrypting all letters)
4. **Enable 2FA** on Supabase account if available
5. **Monitor Supabase logs** for unusual activity
6. **Regular backups** of both database and storage

