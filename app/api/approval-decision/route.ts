import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export interface ApprovalDecisionPayload {
  requestId: string
  decisionPayload: {
    decision?: {
      code?: "A" | "R" | "H" | string
    }
    remarks?: string
  }
  auditUrl?: string
}

const decisionCodeMap: Record<string, string> = {
  A: "Approved",
  R: "Rejected",
  H: "Human",
}
const allowedStatuses = Object.values(decisionCodeMap)

export async function POST(request: NextRequest) {
  try {
    const body: ApprovalDecisionPayload = await request.json()

    const decisionCode = body.decisionPayload?.decision?.code
    const status = decisionCode ? decisionCodeMap[decisionCode] : undefined
    const remarks = body.decisionPayload?.remarks

    if (!body.requestId || !decisionCode || !status) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, decisionPayload.decision.code" },
        { status: 400 }
      )
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` },
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
        decided_by: "System",
        decided_at: decidedAt,
        audit_log_url: body.auditUrl || null,
      })
      .eq("request_id", body.requestId)
      .select("request_id")

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
        request_id: body.requestId,
        status,
        remarks: remarks || null,
        decided_by: "System",
        decided_at: decidedAt,
        audit_log_url: body.auditUrl || null,
      },
    })

  } catch (error) {
    console.error("Error processing approval decision:", error)
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 })
  }
}
