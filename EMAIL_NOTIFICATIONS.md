# Email Notifications Setup

## Current Status

Email notifications are currently **not fully implemented** due to limitations on Supabase's free plan. The notification system is set up to track activities, but actual email sending requires additional setup.

## Options for Email Notifications

### Option 1: Supabase Edge Functions (Recommended)
- Use Supabase Edge Functions with a third-party email service
- Services like Resend, SendGrid, or Mailgun offer free tiers
- Requires setting up Edge Functions in Supabase


### Option 3: Third-Party Service
- Integrate directly with services like:
  - Resend (recommended, developer-friendly)
  - SendGrid
  - Mailgun
  - AWS SES

## Implementation Steps

1. **Set up Edge Function** (if using Option 1):
   ```bash
   supabase functions new send-email
   ```

2. **Add environment variables**:
   - `RESEND_API_KEY` (or your chosen service)
   - `EMAIL_FROM_ADDRESS`

3. **Update `lib/notifications.ts`**:
   - Uncomment email sending code
   - Configure your email service

4. **Enable notifications**:
   - Set `NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED=true` in your `.env`

## Current Features

- ✅ Activity tracking (stored in database)
- ✅ In-app activity feed
- ⚠️ Email sending (requires setup)

## Notification Types

- Letter received
- Letter opened
- Memory added
- Time capsule ready
- Partner activity

## Free Plan Limitations

Supabase free plan has limited email capabilities. For production use, consider:
- Upgrading to Supabase Pro
- Using Edge Functions with third-party services
- Implementing webhook-based notifications

