import { NextRequest, NextResponse } from "next/server"

export interface ApprovalDecisionPayload {
  requestId: string
  status: "Approved" | "Rejected"
  remarks?: string
  decidedBy?: string
  decidedAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ApprovalDecisionPayload = await request.json()

    if (!body.requestId || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, status" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Decision received",
      decision: {
        requestId: body.requestId,
        status: body.status,
        remarks: body.remarks || null,
        decidedBy: body.decidedBy || null,
        decidedAt: body.decidedAt || new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error processing approval decision:", error)
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 })
  }
}
