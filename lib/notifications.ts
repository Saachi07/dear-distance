// Email notification utilities
// Note: Supabase free plan has limited email capabilities
// For production, consider using:
// - Supabase Edge Functions with Resend/SendGrid
// - Supabase paid plan for more email quota
// - Third-party email services

import { createSupabaseClient } from './supabase/client'

export interface NotificationData {
  type: 'letter_received' | 'letter_opened' | 'memory_added' | 'time_capsule_ready' | 'partner_activity'
  recipientId: string
  title: string
  message: string
  link?: string
}

export type ActivityPayload = Record<string, unknown> | null

export async function createActivity(
  userId: string,
  partnerId: string | null,
  activityType: string,
  activityData: ActivityPayload = null
) {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      partner_id: partnerId,
      activity_type: activityType,
      activity_data: activityData,
    })

  if (error) {
    console.error('Error creating activity:', error)
  }
}

export async function sendNotification(notification: NotificationData) {
  // For now, we'll just log the notification
  // In production, you would:
  // 1. Store notification in database
  // 2. Use Supabase Edge Function to send email
  // 3. Or use a third-party email service
  
  console.log('Notification:', notification)
  
  return { success: true }
}

// Helper to check if email notifications are enabled
export function areEmailNotificationsEnabled(): boolean {
  // Check environment or user preference
  // For free plan, this would typically be false
  return process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true'
}

