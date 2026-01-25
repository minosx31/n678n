import { NextRequest, NextResponse } from "next/server"
import type { Process } from "@/context/global-state"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const fallbackProcesses: Process[] = [
  {
    processId: "laptop-request",
    createdAt: "2026-01-10T09:00:00Z",
    name: "Laptop Request",
    description: "Request a new laptop or laptop upgrade for your work needs.",
    version: "v1.0",
    formDefinition: {
      title: "Laptop Request",
      description: "Provide details for your laptop request.",
      fields: [
        {
          fieldId: "laptopType",
          key: "laptop_type",
          label: "Laptop Type",
          type: "select",
          options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"],
          required: true,
        },
        {
          fieldId: "specs",
          key: "specs",
          label: "Required Specifications",
          type: "text",
          placeholder: "e.g., 16GB RAM, 512GB SSD",
          required: true,
        },
        {
          fieldId: "justification",
          key: "justification",
          label: "Business Justification",
          type: "textarea",
          placeholder: "Explain why you need this laptop...",
          required: true,
        },
        {
          fieldId: "quotes",
          key: "quotes",
          label: "Vendor Quotes",
          type: "file",
          multiple: true,
          accept: ".pdf,.png,.jpg,.jpeg",
        },
      ],
    },
    policies: [
      {
        policyId: "POLICY-BUDGET-001",
        policyText: "Requests over $1500 require manager approval.",
        type: "business-rule",
        severity: "high",
      },
    ],
    riskDefinitions: [
      {
        riskId: "RISK-COST-001",
        riskDefinition: "Risk increases when cost exceeds budget thresholds.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Cost-based risk assessment for hardware requests.",
      },
    ],
    agentConfig: {
      allowHumanOverride: true,
      defaultDecision: "H",
      confidenceThreshold: 0.9,
    },
  },
  {
    processId: "leave-approval",
    createdAt: "2026-01-12T09:00:00Z",
    name: "Leave Approval",
    description: "Request time off and route for approval.",
    version: "v1.0",
    formDefinition: {
      title: "Leave Request",
      description: "Provide details for your leave request.",
      fields: [
        {
          fieldId: "leaveType",
          key: "leave_type",
          label: "Leave Type",
          type: "select",
          options: ["Annual Leave", "Sick Leave", "Unpaid Leave", "Bereavement"],
          required: true,
        },
        {
          fieldId: "startDate",
          key: "start_date",
          label: "Start Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          fieldId: "endDate",
          key: "end_date",
          label: "End Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          fieldId: "reason",
          key: "reason",
          label: "Reason",
          type: "textarea",
          placeholder: "Provide a brief justification",
          required: true,
        },
        {
          fieldId: "supportingDocs",
          key: "supporting_docs",
          label: "Supporting Documents",
          type: "file",
          multiple: true,
          accept: ".pdf,.png,.jpg,.jpeg",
        },
      ],
    },
    policies: [
      {
        policyId: "POLICY-LEAVE-001",
        policyText: "Leave requests exceeding 10 business days require senior approval.",
        type: "business-rule",
        severity: "medium",
      },
    ],
    riskDefinitions: [
      {
        riskId: "RISK-COVERAGE-001",
        riskDefinition: "Risk increases when team coverage falls below 60%.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Coverage-based risk assessment for leave.",
      },
    ],
    agentConfig: {
      allowHumanOverride: true,
      defaultDecision: "H",
      confidenceThreshold: 0.85,
    },
  },
]

// GET - Fetch all processes
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("processes")
      .select("process_id,created_at,name,description,version,form_definition,policies,risk_definitions,agent_config")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ processes: fallbackProcesses, total: fallbackProcesses.length })
    }

    const processes = (data || []).map((row) => ({
      processId: row.process_id,
      createdAt: row.created_at,
      name: row.name,
      description: row.description,
      version: row.version,
      formDefinition: row.form_definition,
      policies: row.policies,
      riskDefinitions: row.risk_definitions,
      agentConfig: row.agent_config,
    })) as Process[]

    return NextResponse.json({
      processes: processes.length > 0 ? processes : fallbackProcesses,
      total: processes.length > 0 ? processes.length : fallbackProcesses.length,
    })
  } catch (error) {
    return NextResponse.json({ processes: fallbackProcesses, total: fallbackProcesses.length })
  }
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

    const supabase = getSupabaseServerClient()
    const processId = body.processId || `process-${Date.now()}`
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("processes")
      .insert({
        process_id: processId,
        created_at: body.createdAt || now,
        name: body.name,
        description: body.description || "",
        version: body.version || "v1.0",
        form_definition: body.formDefinition,
        policies: body.policies,
        risk_definitions: body.riskDefinitions || [],
        agent_config: body.agentConfig,
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ process: data?.[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    )
  }
}
