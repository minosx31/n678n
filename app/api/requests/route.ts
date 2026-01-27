import { NextRequest, NextResponse } from "next/server"
import type { Request } from "@/context/global-state"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET - Fetch all requests with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const submittedBy = searchParams.get("submitted_by")
    const processId = searchParams.get("process_id")

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
        return NextResponse.json({ requests: [], total: 0, filters: { status, submitted_by: submittedBy, process_id: processId } })
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

    type RequestRow = {
      submitted_by?: string
      decided_by?: string | null
      decided_at?: string | null
    } & Record<string, unknown>

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
      submitted_by: row.submitted_by ? userNameById.get(row.submitted_by) || row.submitted_by : row.submitted_by,
      decided_by: row.decided_by ?? null,
      decided_at: row.decided_at ?? null,
    }))

    return NextResponse.json({
      requests,
      total: requests.length,
      filters: { status, submitted_by: submittedBy, process_id: processId },
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
    if (!body.process_id || !body.process_name || !body.submitted_by || !body.data) {
      return NextResponse.json(
        { error: "Missing required fields: process_id, process_name, submitted_by, data" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const { data: userRows, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("name", body.submitted_by)
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

    const approvalCallbackUrl = new URL("/api/approval-decision", request.nextUrl.origin).toString()

    const handlerEndpoint = process.env.REQUEST_HANDLER_SERVICE_URL
    if (!handlerEndpoint) {
      return NextResponse.json({ error: "REQUEST_HANDLER_SERVICE_URL is not configured" }, { status: 500 })
    }

    const newRequest: Request = {
      request_id: formatRequestId(now),
      process_id: body.process_id,
      process_name: body.process_name,
      submitted_by: submittedById,
      submitted_at: submittedAt,
      status: "Pending",
      data: body.data,
    }

    const handlerResponse = await fetch(handlerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestContext: {
          requestId: newRequest.request_id,
          processId: newRequest.process_id,
          webhookUrl: approvalCallbackUrl,
          submittedBy: body.submitted_by,
          submittedAt: submittedAt,
        },
        formData: newRequest.data,
      }),
    })

    if (!handlerResponse.ok) {
      const errorText = await handlerResponse.text()
      return NextResponse.json(
        { error: errorText || "Failed to submit approval request" },
        { status: handlerResponse.status }
      )
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
