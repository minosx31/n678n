import { NextRequest, NextResponse } from "next/server"

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
    const { status, approvedBy, comments } = body

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'Approved' or 'Rejected'" },
        { status: 400 }
      )
    }

    // In production, update in database
    const updatedRequest = {
      id,
      status,
      approvedBy: approvedBy || "System",
      approvedAt: new Date().toISOString(),
      comments: comments || null,
    }

    return NextResponse.json({ 
      request: updatedRequest,
      message: `Request ${id} has been ${status.toLowerCase()}`
    })
  } catch (error) {
    console.error("Error updating request:", error)
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    )
  }
}
