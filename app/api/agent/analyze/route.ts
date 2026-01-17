import { NextRequest, NextResponse } from "next/server"

export interface RiskAnalysisRequest {
  requestId: string
  processId: string
  data: Record<string, string | number>
}

export interface RiskAnalysisResult {
  requestId: string
  riskScore: number // 1-10
  riskLevel: "low" | "medium" | "high"
  autoApproved: boolean
  checks: Array<{
    name: string
    status: "passed" | "failed" | "warning"
    details: string
  }>
  recommendation: string
  reasoning: string
}

// Simulated pre-check functions
function checkIPReputation(ip: string): { status: "passed" | "failed" | "warning"; details: string } {
  const knownBadIPs = ["192.168.1.100", "10.0.0.50"]
  const suspiciousRanges = ["172.16."]
  
  if (knownBadIPs.includes(ip)) {
    return { status: "failed", details: `IP ${ip} is flagged in threat database` }
  }
  if (suspiciousRanges.some(range => ip.startsWith(range))) {
    return { status: "warning", details: `IP ${ip} is from a monitored range` }
  }
  return { status: "passed", details: `IP ${ip} has clean reputation` }
}

function checkPortRisk(port: number): { status: "passed" | "failed" | "warning"; details: string; riskAdd: number } {
  const highRiskPorts = [22, 23, 3389, 445, 135]
  const mediumRiskPorts = [21, 25, 110, 143]
  
  if (highRiskPorts.includes(port)) {
    return { status: "failed", details: `Port ${port} is high-risk (commonly exploited)`, riskAdd: 4 }
  }
  if (mediumRiskPorts.includes(port)) {
    return { status: "warning", details: `Port ${port} requires additional justification`, riskAdd: 2 }
  }
  if (port === 443 || port === 80) {
    return { status: "passed", details: `Port ${port} is standard web traffic`, riskAdd: 0 }
  }
  return { status: "passed", details: `Port ${port} appears standard`, riskAdd: 1 }
}

function checkBudget(amount: number): { status: "passed" | "failed" | "warning"; details: string } {
  if (amount > 5000) {
    return { status: "failed", details: `Amount $${amount} exceeds department budget limit` }
  }
  if (amount > 1000) {
    return { status: "warning", details: `Amount $${amount} requires manager approval` }
  }
  return { status: "passed", details: `Amount $${amount} is within auto-approval threshold` }
}

function checkSoftwareSecurity(softwareName: string): { status: "passed" | "failed" | "warning"; details: string } {
  const blockedSoftware = ["bittorrent", "limewire", "utorrent"]
  const requiresReview = ["teamviewer", "anydesk", "remote desktop"]
  
  const lowerName = softwareName.toLowerCase()
  
  if (blockedSoftware.some(s => lowerName.includes(s))) {
    return { status: "failed", details: `${softwareName} is on the blocked software list` }
  }
  if (requiresReview.some(s => lowerName.includes(s))) {
    return { status: "warning", details: `${softwareName} requires security review` }
  }
  return { status: "passed", details: `${softwareName} passed security scan` }
}

export async function POST(request: NextRequest) {
  try {
    const body: RiskAnalysisRequest = await request.json()
    const { requestId, processId, data } = body

    if (!requestId || !processId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, processId, data" },
        { status: 400 }
      )
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800))

    const checks: RiskAnalysisResult["checks"] = []
    let baseRiskScore = 2

    // Run different checks based on the process type
    if (processId.includes("firewall") || data.source_ip || data.port) {
      // Firewall-related checks
      if (data.source_ip) {
        const ipCheck = checkIPReputation(String(data.source_ip))
        checks.push({ name: "IP Reputation Check", ...ipCheck })
        if (ipCheck.status === "failed") baseRiskScore += 4
        if (ipCheck.status === "warning") baseRiskScore += 2
      }
      
      if (data.port) {
        const portCheck = checkPortRisk(Number(data.port))
        checks.push({ name: "Port Risk Assessment", status: portCheck.status, details: portCheck.details })
        baseRiskScore += portCheck.riskAdd
      }
    }

    if (processId.includes("software") || data.software_name) {
      // Software installation checks
      if (data.software_name) {
        const softwareCheck = checkSoftwareSecurity(String(data.software_name))
        checks.push({ name: "Software Security Scan", ...softwareCheck })
        if (softwareCheck.status === "failed") baseRiskScore += 5
        if (softwareCheck.status === "warning") baseRiskScore += 2
      }
      
      if (data.license_type === "Paid" || data.license_type === "Enterprise") {
        checks.push({ 
          name: "License Cost Check", 
          status: "warning", 
          details: "Paid license requires procurement approval" 
        })
        baseRiskScore += 1
      }
    }

    if (data.amount) {
      const budgetCheck = checkBudget(Number(data.amount))
      checks.push({ name: "Budget Verification", ...budgetCheck })
      if (budgetCheck.status === "failed") baseRiskScore += 3
      if (budgetCheck.status === "warning") baseRiskScore += 1
    }

    // Add default check if none were run
    if (checks.length === 0) {
      checks.push({ 
        name: "Basic Validation", 
        status: "passed", 
        details: "Request data validated successfully" 
      })
    }

    // Cap risk score at 10
    const riskScore = Math.min(baseRiskScore, 10)
    const riskLevel: "low" | "medium" | "high" = 
      riskScore <= 3 ? "low" : riskScore <= 6 ? "medium" : "high"
    
    const autoApproved = riskLevel === "low" && !checks.some(c => c.status === "failed")

    const result: RiskAnalysisResult = {
      requestId,
      riskScore,
      riskLevel,
      autoApproved,
      checks,
      recommendation: autoApproved 
        ? "Auto-approve: All pre-checks passed with low risk."
        : riskLevel === "high"
          ? "Manual review required: High risk indicators detected."
          : "Escalate to manager: Medium risk requires human verification.",
      reasoning: `Risk score ${riskScore}/10 based on ${checks.length} automated checks. ` +
        `${checks.filter(c => c.status === "passed").length} passed, ` +
        `${checks.filter(c => c.status === "warning").length} warnings, ` +
        `${checks.filter(c => c.status === "failed").length} failed.`
    }

    return NextResponse.json({ analysis: result })
  } catch (error) {
    console.error("Error analyzing request:", error)
    return NextResponse.json(
      { error: "Failed to analyze request" },
      { status: 500 }
    )
  }
}
