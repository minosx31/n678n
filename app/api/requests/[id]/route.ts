import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET - Fetch a specific request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // In production, fetch from database
  return NextResponse.json({
    message: `Request ${id} endpoint ready`,
    id
  })
}

// PATCH - Update request status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, decided_by, remarks } = body

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'Approved' or 'Rejected'" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const decidedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from("requests")
      .update({
        status,
        remarks: remarks || null,
        decided_by: decided_by || "System",
        decided_at: decidedAt,
      })
      .eq("request_id", id)
      .select("request_id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({
      request: {
        request_id: id,
        status,
        decided_by: decided_by || "System",
        decided_at: decidedAt,
        remarks: remarks || null,
      },
      message: `Request ${id} has been ${status.toLowerCase()}`,
    })
  } catch (error) {
    console.error("Error updating request:", error)
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    )
  }
}
