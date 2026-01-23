import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { Process } from "@/context/global-state"

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
        "fieldId": "field_key_camelCase",
        "label": "Human Readable Label",
        "type": "text" | "number" | "array" | "email" | "select",
        "required": true,
        "placeholder": "Example input...",
        "validation": { "maxLength": 100, "min": 0, "max": 1000000 }
      }
    ]
  },
  "policies": [
    {
      "policyId": "POLICY-TYPE-001",
      "policyText": "Clear business rule (e.g., 'Loan-to-income ratio must be ≤ 0.30')",
      "type": "business-rule",
      "severity": "high" | "medium" | "low"
    }
  ],
  "riskDefinitions": [
    {
      "riskId": "RISK-TYPE-001",
      "riskDefinition": "Logic description (e.g., 'Risk score = weighted average of...')",
      "thresholds": { "low": 0.3, "medium": 0.6, "high": 1.0 },
      "description": "Explanation of what this risk measures"
    }
  ],
  "agentConfig": {
    "allowHumanOverride": true,
    "defaultDecision": "H", // H = Human, A = Approve, R = Reject
    "confidenceThreshold": 0.90
  }
}

### RULES
1. **Fields:** Map user requirements to specific inputs. For arrays (e.g., "list of loans"), use type "array" with an "itemType".
2. **Policies:** Convert constraints (budget caps, security checks) into explicit "policies".
3. **Risks:** Define how risk is calculated based on the inputs (e.g., high amounts = higher risk).
4. **Exclusions:** Do NOT include a "referenceDocuments" field.
5. **Format:** Return ONLY raw JSON.
`

async function generateWithGemini(description: string, referenceText?: string): Promise<Process | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
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
    
    // Validate required fields based on Data_Contracts schema
    if (!parsed.name || !parsed.formDefinition || !parsed.policies) {
      throw new Error("Invalid process structure from LLM")
    }
    
    // Return the parsed object directly as it matches the desired schema
    // We inject an ID and timestamps since the LLM doesn't generate dynamic server data
    return {
      processId: `PROC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...parsed
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
