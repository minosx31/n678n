import { NextRequest, NextResponse } from "next/server"
import type { Request } from "@/context/global-state"

// In-memory store (replace with database in production)
let requestsStore: Request[] = []

// GET - Fetch all requests with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const submittedBy = searchParams.get("submittedBy")
  const processId = searchParams.get("processId")

  let filteredRequests = [...requestsStore]

  if (status) {
    filteredRequests = filteredRequests.filter(r => r.status === status)
  }
  if (submittedBy) {
    filteredRequests = filteredRequests.filter(r => r.submittedBy === submittedBy)
  }
  if (processId) {
    filteredRequests = filteredRequests.filter(r => r.processId === processId)
  }

  return NextResponse.json({ 
    requests: filteredRequests,
    total: filteredRequests.length,
    filters: { status, submittedBy, processId }
  })
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

    const newRequest: Request = {
      id: `req-${Date.now()}`,
      processId: body.processId,
      processName: body.processName,
      submittedBy: body.submittedBy,
      submittedAt: new Date().toISOString(),
      status: "Pending",
      data: body.data,
    }

    requestsStore.push(newRequest)

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}
