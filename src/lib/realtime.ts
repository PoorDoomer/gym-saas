import { createClient } from './supabase/client'

const supabase = createClient()

export function subscribeToMembers(cb: () => void) {
  return supabase.channel('members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, cb).subscribe()
}
