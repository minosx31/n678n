import { NextRequest, NextResponse } from "next/server"
import type { Process } from "@/context/global-state"

// In-memory store (replace with database in production)
const processesStore: Process[] = []

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
    
    if (!body.name || !body.formDefinition || !body.policies || !body.agentConfig) {
      return NextResponse.json(
        { error: "Missing required fields: name, formDefinition, policies, agentConfig" },
        { status: 400 }
      )
    }

    const processId = body.processId || body.id || `process-${Date.now()}`
    const now = new Date().toISOString()

    const newProcess: Process = {
      processId,
      createdAt: body.createdAt || now,
      name: body.name,
      description: body.description || "",
      version: body.version || "v1.0",
      formDefinition: body.formDefinition,
      policies: body.policies,
      riskDefinitions: body.riskDefinitions || [],
      agentConfig: body.agentConfig,
      // Legacy compatibility
      id: body.id || processId,
      fields: body.fields || body.formDefinition?.fields,
      steps: body.steps || [],
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
