import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { FormField, RiskDefinition } from "@/context/global-state"

export interface GenerateProcessRequest {
  description: string
  referenceText?: string
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const SYSTEM_PROMPT = `You are an expert IT Process Architect for the N678N Enterprise System. 
Your goal is to convert natural language requests into executable JSON configurations for an Agentic Approval Engine.

### OUTPUT SCHEMA
Return a single JSON object acting as the "Process Context". 
Structure your response exactly as follows (strictly JSON, no markdown):

{
  "name": "Process Name (Title Case)",
  "description": "Short description of the process.",
  "version": "v1.0",
  "formDefinition": {
    "title": "Form Title",
    "description": "Form description",
    "fields": [
      {
        "fieldId": "fieldKeyCamelCase",
        "label": "Human Readable Label",
        "type": "text" | "number" | "array" | "email" | "select" | "file",
        "required": true,
        "placeholder": "Example input...",
        "validation": { "maxLength": 100, "min": 0, "max": 1000000 }
      }
    ]
  },
  "policies": [
    {
      "policy_id": "policy_type_001",
      "policy_text": "Clear business rule (e.g., 'Loan-to-income ratio must be ≤ 0.30')",
      "type": "business-rule",
      "severity": "high" | "medium" | "low"
    }
  ],
  "riskDefinitions": [
    {
      "risk_id": "risk_type_001",
      "risk_definition": "Logic description (e.g., 'Risk score = weighted average of...')",
      "thresholds": { "low": 0.3, "medium": 0.6, "high": 1.0 },
      "description": "Explanation of what this risk measures"
    }
  ],
  "agent_config": {
    "allow_human_override": true,
    "default_decision": "H", // H = Human, A = Approve, R = Reject
    "confidence_threshold": 0.90
  }
}

### RULES
1. **Fields:** Map user requirements to specific inputs. For arrays (e.g., "list of loans"), use type "array" with an "itemType".
2. **Policies:** Convert constraints (budget caps, security checks) into explicit "policies".
3. **Risks:** Define how risk is calculated based on the inputs (e.g., high amounts = higher risk).
4. **Exclusions:** Do NOT include a "referenceDocuments" field.
5. **Format:** Return ONLY raw JSON.
`

async function generateWithGemini(description: string, referenceText?: string): Promise<Record<string, unknown> | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
    const trimmedReference = referenceText?.trim()
    const referenceBlock = trimmedReference
      ? `\n\nReference context (user-provided):\n"""\n${trimmedReference.slice(0, 8000)}\n"""`
      : ""
    
    const prompt = `${SYSTEM_PROMPT}

User's process description:
"${description}"

${referenceBlock}

Generate the Process Context JSON:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean up the response - remove any markdown formatting
    let cleanedText = text.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7)
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedText)

    const normalizeProcess = (input: Record<string, unknown>): Record<string, unknown> => {
      const formDefinition = (input.form_definition || input.formDefinition) as Record<string, unknown> | undefined
      const fields = Array.isArray(formDefinition?.fields) ? formDefinition?.fields : []

      const normalizedFields = fields.map((field, index) => {
        const rawField = field as Record<string, unknown>
        const fieldId =
          (rawField.field_id as string) ||
          (rawField.fieldId as string) ||
          (rawField.key as string) ||
          `field_${index + 1}`

        return {
          fieldId: fieldId,
          key: (rawField.key as string) || fieldId,
          label: (rawField.label as string) || "",
          type: (rawField.type as FormField["type"]) || "text",
          required: rawField.required as boolean | undefined,
          placeholder: rawField.placeholder as string | undefined,
          options: rawField.options as string[] | undefined,
          itemType: (rawField.item_type as FormField["item_type"]) || (rawField.itemType as FormField["item_type"]) || undefined,
          multiple: rawField.multiple as boolean | undefined,
          accept: rawField.accept as string | undefined,
          validation: rawField.validation as FormField["validation"] | undefined,
        }
      })

      const normalizedFormDefinition = formDefinition
        ? {
            ...formDefinition,
            title: (formDefinition.title as string) || (input.name as string) || "",
            description: (formDefinition.description as string) || (input.description as string) || "",
            fields: normalizedFields,
          }
        : undefined

      const policies = Array.isArray(input.policies) ? (input.policies as Record<string, unknown>[]) : []
      const normalizedPolicies = policies.map((policy) => ({
        policy_id: (policy.policy_id as string) || (policy.policyId as string) || undefined,
        process_id: policy.process_id as string | undefined,
        policy_text: (policy.policy_text as string) || (policy.policyText as string) || "",
        type: (policy.type as "business-rule") || "business-rule",
        severity: (policy.severity as "high" | "medium" | "low") || "medium",
        version: policy.version as string | undefined,
        created_at: policy.created_at as string | undefined,
      }))

      const risks = Array.isArray(input.risk_definitions)
        ? (input.risk_definitions as Record<string, unknown>[]) 
        : Array.isArray(input.riskDefinitions)
          ? (input.riskDefinitions as Record<string, unknown>[]) 
          : []

      const normalizedRisks = risks.map((risk) => ({
        riskId: (risk.risk_id as string) || (risk.riskId as string) || undefined,
        riskDefinition: (risk.risk_definition as string) || (risk.riskDefinition as string) || "",
        thresholds: (risk.thresholds as RiskDefinition["thresholds"]) || { low: 0.3, medium: 0.6, high: 1.0 },
        description: risk.description as string | undefined,
        version: risk.version as string | undefined,
        createdAt: risk.created_at as string | undefined,
      }))

      const agentConfig = (input.agent_config || input.agentConfig) as Record<string, unknown> | undefined
      const normalizedAgentConfig = agentConfig
        ? {
            allowHumanOverride:
              (agentConfig.allow_human_override as boolean) ?? (agentConfig.allowHumanOverride as boolean) ?? true,
            defaultDecision:
              (agentConfig.default_decision as "H" | "A" | "R") ||
              (agentConfig.defaultDecision as "H" | "A" | "R") ||
              "H",
            confidenceThreshold:
              (agentConfig.confidence_threshold as number) ?? (agentConfig.confidenceThreshold as number) ?? 0.9,
          }
        : undefined

      return {
        name: (input.name as string) || "",
        description: (input.description as string) || "",
        version: (input.version as string) || "v1.0",
        formDefinition: normalizedFormDefinition,
        policies: normalizedPolicies,
        riskDefinitions: normalizedRisks,
        agentConfig: normalizedAgentConfig,
      }
    }

    const normalized = normalizeProcess(parsed)

    if (!normalized.name || !normalized.formDefinition || !normalized.policies) {
      throw new Error("Invalid process structure from LLM")
    }

    return {
      process_id: `PROC-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...normalized,
    }

  } catch (error) {
    console.error("Gemini generation error:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API Key Availability
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured." },
        { status: 500 }
      )
    }

    const body: GenerateProcessRequest = await request.json()
    const { description, referenceText } = body

    // 2. Validate Input
    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed description (at least 10 characters)" },
        { status: 400 }
      )
    }

    // 3. Generate Process (No Fallback)
    const generatedProcess = await generateWithGemini(description, referenceText)

    if (!generatedProcess) {
      return NextResponse.json(
        { error: "Failed to generate process configuration. Please try again." },
        { status: 500 }
      )
    }

    // 4. Return Success
    return NextResponse.json({ 
      process: generatedProcess
    })

  } catch (error) {
    console.error("Error in generate-process API:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
