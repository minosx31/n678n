import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export interface ApprovalDecisionPayload {
  requestId: string
  status: string
  remarks?: string
  decidedBy?: string
  decidedAt?: string
  auditLogUrl?: string
}

const allowedStatuses = ["Approved", "Rejected", "Human"]

export async function POST(request: NextRequest) {
  try {
    const body: ApprovalDecisionPayload = await request.json()

    if (!body.requestId || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, status" },
        { status: 400 }
      )
    }

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const decidedAt = body.decidedAt || new Date().toISOString()
    const { data, error } = await supabase
      .from("requests")
      .update({
        status: body.status,
        remarks: body.remarks || null,
        decided_by: body.decidedBy || null,
        decided_at: decidedAt,
        audit_log_url: body.auditLogUrl || null,
      })
      .eq("request_code", body.requestId)
      .select("request_code")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      message: "Decision received",
      decision: {
        requestId: body.requestId,
        status: body.status,
        remarks: body.remarks || null,
        decidedBy: body.decidedBy || null,
        decidedAt,
        auditLogUrl: body.auditLogUrl || null,
      },
    })

  } catch (error) {
    console.error("Error processing approval decision:", error)
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 })
  }
}
