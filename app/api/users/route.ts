import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, name, role, email")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error occurred when fetching users"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
