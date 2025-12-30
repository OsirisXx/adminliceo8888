import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xhycfszagszwquckhqly.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WkXfZGW0Rroc5ZLkuN0-hw_lXgstbJM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
