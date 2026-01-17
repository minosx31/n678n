import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { Process } from "@/context/global-state"

export interface GenerateProcessRequest {
  description: string
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// System prompt for the LLM to generate structured process JSON
const SYSTEM_PROMPT = `You are an expert IT Process Architect for the N678N Enterprise System. 
Your goal is to convert natural language requests into executable JSON configurations.

### THE TOOLKIT (Strictly use these Action IDs)
When defining "steps", you MUST strictly choose from this list of available system capabilities:
- "verify_ip_reputation" (Checks if an IP is malicious)
- "check_budget_availability" (Checks cost center balance)
- "check_software_license" (Checks if a license is available)
- "manager_approval" (Routes to human manager)
- "security_team_approval" (Routes to InfoSec team)
- "auto_approve" (Immediately resolves the request)
- "send_notification" (Email/Slack update)

### OUTPUT SCHEMA
Return a single JSON object with this exact structure:
{
  "name": "Process Name (Title Case)",
  "description": "Short description.",
  "fields": [
    {
      "key": "field_key_snake_case",
      "label": "Human Readable Label",
      "type": "text" | "number" | "textarea" | "select" | "email",
      "required": true | false,
      "placeholder": "Example input...",
      "options": ["Option1", "Option2"] // Required ONLY for 'select' type
    }
  ],
  "steps": [
    {
      "id": "step_1",
      "type": "automated_check" | "human_approval" | "notification",
      "action": "ACTION_ID_FROM_TOOLKIT", 
      "description": "What is happening in this step?",
      "condition": "Optional logic (e.g., 'risk_score > 5' or 'cost > 500')"
    }
  ]
}

### RULES
1. **Field Logic:** Always include a "justification" or "reason" field in the form.
2. **Step Logic:** Start with "automated_check" steps (pre-validation) BEFORE "human_approval" steps.
3. **Autonomy:** If the request seems low risk (e.g., "standard software"), include a logic path for "auto_approve".
4. **Safety:** Do NOT invent new action IDs. If an action doesn't exist in the Toolkit, use "manager_approval" as a fallback.
5. **Format:** Return ONLY raw JSON. No markdown (\`\`\`), no explanations.
`

// Fallback patterns for when LLM is unavailable
const FALLBACK_PATTERNS: Record<string, Partial<Process>> = {
  firewall: {
    name: "Firewall Access Request",
    description: "Opens ports for external IPs with security verification.",
    fields: [
      { key: "source_ip", label: "Source IP", type: "text", placeholder: "e.g., 192.168.1.1" },
      { key: "destination_ip", label: "Destination IP", type: "text", placeholder: "e.g., 10.0.0.1" },
      { key: "port", label: "Destination Port", type: "number", placeholder: "e.g., 443" },
      { key: "protocol", label: "Protocol", type: "select", options: ["TCP", "UDP", "ICMP"] },
      { key: "reason", label: "Business Justification", type: "textarea", placeholder: "Explain why this access is needed..." },
    ],
    steps: [
      { name: "AI Risk Analysis", action: "check_ip_reputation" },
      { name: "Security Team Review", condition: "risk_score > 3" },
      { name: "Manager Approval", condition: "risk_score > 5" },
      { name: "Implementation", action: "apply_firewall_rule" },
    ],
  },
  software: {
    name: "Software Installation Request",
    description: "Request installation of new software on your workstation.",
    fields: [
      { key: "software_name", label: "Software Name", type: "text", placeholder: "e.g., Visual Studio Code" },
      { key: "version", label: "Version", type: "text", placeholder: "e.g., Latest" },
      { key: "license_type", label: "License Type", type: "select", options: ["Free", "Paid", "Enterprise", "Open Source"] },
      { key: "justification", label: "Business Justification", type: "textarea", placeholder: "Describe how this software will be used..." },
    ],
    steps: [
      { name: "Security Scan", action: "scan_software_registry" },
      { name: "License Verification", action: "check_license_availability" },
      { name: "IT Approval", condition: "is_paid_software" },
      { name: "Installation", action: "deploy_software" },
    ],
  },
  default: {
    name: "Custom Approval Process",
    description: "A custom approval workflow.",
    fields: [
      { key: "request_title", label: "Request Title", type: "text", placeholder: "Brief title for your request" },
      { key: "request_details", label: "Request Details", type: "textarea", placeholder: "Describe your request in detail..." },
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
    ],
    steps: [
      { name: "Initial Review", action: "auto_review" },
      { name: "Manager Approval", condition: "requires_approval" },
      { name: "Completion", action: "complete_request" },
    ],
  },
}

async function generateWithGemini(description: string): Promise<Process | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const prompt = `${SYSTEM_PROMPT}

User's process description:
"${description}"

Generate the JSON configuration:`

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
    
    // Validate required fields
    if (!parsed.name || !parsed.fields || !parsed.steps) {
      throw new Error("Invalid process structure from LLM")
    }
    
    return {
      id: `process-${Date.now()}`,
      name: parsed.name,
      description: parsed.description || description.slice(0, 200),
      fields: parsed.fields,
      steps: parsed.steps,
    }
  } catch (error) {
    console.error("Gemini generation error:", error)
    return null
  }
}

function getFallbackProcess(description: string): Process {
  const lowerDesc = description.toLowerCase()
  
  let pattern = FALLBACK_PATTERNS.default
  
  if (lowerDesc.includes("firewall") || lowerDesc.includes("port") || lowerDesc.includes("ip")) {
    pattern = FALLBACK_PATTERNS.firewall
  } else if (lowerDesc.includes("software") || lowerDesc.includes("install") || lowerDesc.includes("application")) {
    pattern = FALLBACK_PATTERNS.software
  }
  
  return {
    id: `process-${Date.now()}`,
    name: pattern.name!,
    description: pattern.description!,
    fields: pattern.fields!,
    steps: pattern.steps!,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateProcessRequest = await request.json()
    const { description } = body

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed description (at least 10 characters)" },
        { status: 400 }
      )
    }

    let generatedProcess: Process | null = null
    let usedLLM = false

    // Try Gemini first if API key is available
    if (process.env.GEMINI_API_KEY) {
      generatedProcess = await generateWithGemini(description)
      if (generatedProcess) {
        usedLLM = true
      }
    }

    // Fallback to pattern matching if LLM fails or is unavailable
    if (!usedLLM) {
      console.log("Using fallback pattern matching")
      generatedProcess = getFallbackProcess(description)
    }

    return NextResponse.json({ 
      process: generatedProcess,
      source: usedLLM ? "gemini" : "fallback"
    })
  } catch (error) {
    console.error("Error generating process:", error)
    return NextResponse.json(
      { error: "Failed to generate process. Please try again." },
      { status: 500 }
    )
  }
}
