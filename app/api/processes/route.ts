import { NextRequest, NextResponse } from "next/server"
import type { Process } from "@/context/global-state"

// In-memory store (replace with database in production)
let processesStore: Process[] = []

// GET - Fetch all processes
export async function GET() {
  return NextResponse.json({ 
    processes: processesStore,
    total: processesStore.length
  })
}

// POST - Create a new process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name || !body.fields || !body.steps) {
      return NextResponse.json(
        { error: "Missing required fields: name, fields, steps" },
        { status: 400 }
      )
    }

    const newProcess: Process = {
      id: body.id || `process-${Date.now()}`,
      name: body.name,
      description: body.description || "",
      fields: body.fields,
      steps: body.steps,
    }

    processesStore.push(newProcess)

    return NextResponse.json({ process: newProcess }, { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    )
  }
}
