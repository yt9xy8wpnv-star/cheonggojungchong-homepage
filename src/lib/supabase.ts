import { createClient } from '@supabase/supabase-js'

const viteEnv =
  typeof import.meta !== 'undefined' &&
  import.meta &&
  typeof import.meta.env === 'object' &&
  import.meta.env !== null
    ? (import.meta.env as Record<string, string | undefined>)
    : undefined

const supabaseUrl = viteEnv?.VITE_SUPABASE_URL ?? ''
const supabaseKey = viteEnv?.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey)
export const supabase = supabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null
