import { NextRequest, NextResponse } from "next/server"
import type { Request } from "@/context/global-state"
import { getSupabaseServerClient } from "@/lib/supabase/server"

async function insertRequestToSupabase(request: Request) {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("requests")
      .insert({
        request_code: request.id,
        process_id: request.processId,
        process_name: request.processName,
        submitted_by: request.submittedBy,
        status: request.status,
        submitted_at: request.submittedAt,
        remarks: request.remarks || null,
        decided_by: request.decidedBy || null,
        decided_at: request.decidedAt || null,
        data: request.data,
      })
      .select()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// GET - Fetch all requests with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const submittedBy = searchParams.get("submittedBy")
    const processId = searchParams.get("processId")

    let submittedById: string | null = null
    if (submittedBy) {
      const { data: userRows, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("name", submittedBy)
        .limit(1)

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      submittedById = userRows?.[0]?.id ?? null
      if (!submittedById) {
        return NextResponse.json({ requests: [], total: 0, filters: { status, submittedBy, processId } })
      }
    }

    let query = supabase.from("requests").select("*")

    if (status) {
      query = query.eq("status", status)
    }
    if (submittedById) {
      query = query.eq("submitted_by", submittedById)
    }
    if (processId) {
      query = query.eq("process_id", processId)
    }

    const { data, error } = await query.order("submitted_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    type RequestRow = { submitted_by?: string } & Record<string, unknown>

    const requestRows = (data || []) as RequestRow[]
    const submittedIds = Array.from(
      new Set(requestRows.map((row) => row.submitted_by).filter((id): id is string => Boolean(id)))
    )

    let userNameById = new Map<string, string>()
    if (submittedIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id,name")
        .in("id", submittedIds)

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 })
      }

      userNameById = new Map((usersData || []).map((user) => [user.id, user.name]))
    }

    const requests = requestRows.map((row) => ({
      ...row,
      submittedBy: row.submitted_by ? userNameById.get(row.submitted_by) || row.submitted_by : row.submitted_by,
    }))

    return NextResponse.json({
      requests,
      total: requests.length,
      filters: { status, submittedBy, processId },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.processId || !body.processName || !body.submittedBy || !body.data) {
      return NextResponse.json(
        { error: "Missing required fields: processId, processName, submittedBy, data" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const { data: userRows, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("name", body.submittedBy)
      .limit(1)

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    const submittedById = userRows?.[0]?.id
    if (!submittedById) {
      return NextResponse.json({ error: "Submitted user not found" }, { status: 400 })
    }

    const now = new Date()
    const submittedAt = now.toISOString()
    const formatRequestId = (date: Date) => {
      const datePart = date.toISOString().slice(0, 10).replace(/-/g, "")
      const timePart = date.toTimeString().slice(0, 8).replace(/:/g, "")
      return `req-${datePart}-${timePart}`
    }

    const newRequest: Request = {
      id: formatRequestId(now),
      processId: body.processId,
      processName: body.processName,
      submittedBy: submittedById,
      submittedAt,
      status: "Pending",
      data: body.data,
    }

    const supabaseResult = await insertRequestToSupabase(newRequest)
    if (!supabaseResult.ok) {
      console.error("Supabase insert failed:", supabaseResult.error)
      return NextResponse.json(
        { error: supabaseResult.error || "Failed to create request" },
        { status: 500 }
      )
    }

    const workflowEndpoint = process.env.WORKFLOW_ENDPOINT_URL
    if (workflowEndpoint) {
      try {
        const approvalCallbackUrl = new URL("/api/approval-decision", request.nextUrl.origin).toString()
        await fetch(workflowEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_code: newRequest.id,
            process_id: newRequest.processId,
            data: newRequest.data,
            approval_callback_url: approvalCallbackUrl,
          }),
        })
      } catch (error) {
        console.error("Failed to notify workflow endpoint:", error)
      }
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}
