import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase URL und Key fehlen! Bitte .env.local anlegen.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
