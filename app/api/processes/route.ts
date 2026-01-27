import { NextRequest, NextResponse } from "next/server"
import type { Process } from "@/context/global-state"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const fallbackProcesses: Process[] = [
  {
    process_id: "laptop-request",
    created_at: "2026-01-10T09:00:00Z",
    name: "Laptop Request",
    description: "Request a new laptop or laptop upgrade for your work needs.",
    version: "v1.0",
    form_definition: {
      title: "Laptop Request",
      description: "Provide details for your laptop request.",
      fields: [
        {
          field_id: "laptop_type",
          key: "laptop_type",
          label: "Laptop Type",
          type: "select",
          options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"],
          required: true,
        },
        {
          field_id: "specs",
          key: "specs",
          label: "Required Specifications",
          type: "text",
          placeholder: "e.g., 16GB RAM, 512GB SSD",
          required: true,
        },
        {
          field_id: "justification",
          key: "justification",
          label: "Business Justification",
          type: "textarea",
          placeholder: "Explain why you need this laptop...",
          required: true,
        },
        {
          field_id: "quotes",
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
        policy_text: "Requests over $1500 require manager approval.",
        type: "business-rule",
        severity: "high",
      },
    ],
    risk_definitions: [
      {
        risk_definition: "Risk increases when cost exceeds budget thresholds.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Cost-based risk assessment for hardware requests.",
      },
    ],
    agent_config: {
      allow_human_override: true,
      default_decision: "H",
      confidence_threshold: 0.9,
    },
  },
  {
    process_id: "leave-approval",
    created_at: "2026-01-12T09:00:00Z",
    name: "Leave Approval",
    description: "Request time off and route for approval.",
    version: "v1.0",
    form_definition: {
      title: "Leave Request",
      description: "Provide details for your leave request.",
      fields: [
        {
          field_id: "leave_type",
          key: "leave_type",
          label: "Leave Type",
          type: "select",
          options: ["Annual Leave", "Sick Leave", "Unpaid Leave", "Bereavement"],
          required: true,
        },
        {
          field_id: "start_date",
          key: "start_date",
          label: "Start Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          field_id: "end_date",
          key: "end_date",
          label: "End Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          field_id: "reason",
          key: "reason",
          label: "Reason",
          type: "textarea",
          placeholder: "Provide a brief justification",
          required: true,
        },
        {
          field_id: "supporting_docs",
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
        policy_text: "Leave requests exceeding 10 business days require senior approval.",
        type: "business-rule",
        severity: "medium",
      },
    ],
    risk_definitions: [
      {
        risk_definition: "Risk increases when team coverage falls below 60%.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Coverage-based risk assessment for leave.",
      },
    ],
    agent_config: {
      allow_human_override: true,
      default_decision: "H",
      confidence_threshold: 0.85,
    },
  },
]

// GET - Fetch all processes
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    // Fetch processes with related data from separate tables
    const { data, error } = await supabase
      .from("processes")
      .select(`
        process_id,
        created_at,
        created_by,
        name,
        description,
        version,
        form_definitions (
          form_definition_id,
          title,
          description,
          fields,
          version,
          created_at
        ),
        policies (
          policy_id,
          policy_text,
          severity,
          type,
          version,
          created_at
        ),
        risk_definitions (
          risk_id,
          risk_definition,
          thresholds,
          version,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase fetch error:", error.message, error.details, error.hint)
      return NextResponse.json({ processes: fallbackProcesses, total: fallbackProcesses.length })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processes = (data || []).map((row: any) => {
      // Get the first form definition (or construct one from the array)
      const formDefs = row.form_definitions || []
      const formDefinition = formDefs.length > 0 ? {
        form_definition_id: formDefs[0].form_definition_id,
        title: formDefs[0].title,
        description: formDefs[0].description,
        fields: formDefs[0].fields || [],
        version: formDefs[0].version,
        created_at: formDefs[0].created_at,
      } : undefined
      
      return {
        process_id: row.process_id,
        created_at: row.created_at,
        created_by: row.created_by,
        name: row.name,
        description: row.description,
        version: row.version,
        form_definition: formDefinition,
        policies: row.policies || [],
        risk_definitions: row.risk_definitions || [],
        agent_config: {
          allow_human_override: true,
          default_decision: "H" as const,
          confidence_threshold: 0.9,
        },
      }
    }) as Process[]

    return NextResponse.json({
      processes: processes.length > 0 ? processes : fallbackProcesses,
      total: processes.length > 0 ? processes.length : fallbackProcesses.length,
    })
  } catch (error) {
    console.error("Error fetching processes:", error)
    return NextResponse.json({ processes: fallbackProcesses, total: fallbackProcesses.length })
  }
}

// POST - Create a new process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    const processId = body.process_id || crypto.randomUUID()
    const now = new Date().toISOString()

    // 1. Insert into processes table
    const { error: processError } = await supabase
      .from("processes")
      .insert({
        process_id: processId,
        created_at: body.created_at || now,
        created_by: body.created_by || "admin",
        name: body.name,
        description: body.description || "",
        version: body.version || "v1.0",
      })

    if (processError) {
      console.error("Error inserting process:", processError)
      return NextResponse.json({ error: processError.message }, { status: 500 })
    }

    // 2. Insert form definition if provided
    if (body.form_definition) {
      const { error: formError } = await supabase
        .from("form_definitions")
        .insert({
          form_definition_id: crypto.randomUUID(),
          process_id: processId,
          title: body.form_definition.title || body.name,
          description: body.form_definition.description || body.description || "",
          fields: body.form_definition.fields || [],
          version: body.form_definition.version || "1.0",
          created_at: now,
        })

      if (formError) {
        console.error("Error inserting form_definition:", formError)
      }
    }

    // 3. Insert policies if provided
    if (body.policies && Array.isArray(body.policies)) {
      for (const policy of body.policies) {
        const { error: policyError } = await supabase
          .from("policies")
          .insert({
            policy_id: crypto.randomUUID(),
            process_id: processId,
            policy_text: policy.policy_text,
            severity: policy.severity || "medium",
            type: policy.type || "business-rule",
            version: policy.version || "1.0",
            created_at: now,
          })

        if (policyError) {
          console.error("Error inserting policy:", policyError)
        }
      }
    }

    // 4. Insert risk definitions if provided
    if (body.risk_definitions && Array.isArray(body.risk_definitions)) {
      for (const risk of body.risk_definitions) {
        const { error: riskError } = await supabase
          .from("risk_definitions")
          .insert({
            risk_id: crypto.randomUUID(),
            process_id: processId,
            risk_definition: risk.risk_definition,
            thresholds: risk.thresholds || { low: 0.3, medium: 0.6, high: 1.0 },
            version: risk.version || "1.0",
            created_at: now,
          })

        if (riskError) {
          console.error("Error inserting risk_definition:", riskError)
        }
      }
    }

    return NextResponse.json({ 
      process: { 
        process_id: processId,
        name: body.name,
        description: body.description,
        version: body.version || "v1.0",
        created_at: now,
      } 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating process:", error)
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    )
  }
}
