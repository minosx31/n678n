import { createClient } from "@supabase/supabase-js"

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PRIVATE_SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing")
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
