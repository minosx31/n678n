"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Process } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sparkles, Loader2, Check, FileText, ArrowRight, ListChecks } from "lucide-react"
import { useEffect } from "react"

const firewallJson: Process = {
  id: `firewall-${Date.now()}`,
  name: "Firewall Access Request",
  description: "Opens ports for external IPs.",
  fields: [
    { key: "source_ip", label: "Source IP", type: "text", placeholder: "192.168.x.x" },
    { key: "port", label: "Destination Port", type: "number", placeholder: "443" },
    { key: "reason", label: "Business Justification", type: "textarea" },
  ],
  steps: [
    { name: "AI Risk Analysis", action: "check_ip_reputation" },
    { name: "Manager Approval", condition: "risk > 5" },
  ],
}

const softwareJson: Process = {
  id: `software-${Date.now()}`,
  name: "Software Installation Request",
  description: "Request installation of new software on your workstation.",
  fields: [
    { key: "software_name", label: "Software Name", type: "text", placeholder: "e.g., Visual Studio Code" },
    { key: "version", label: "Version", type: "text", placeholder: "e.g., Latest" },
    { key: "license_type", label: "License Type", type: "select", options: ["Free", "Paid", "Enterprise"] },
    { key: "justification", label: "Business Justification", type: "textarea" },
  ],
  steps: [
    { name: "Security Scan", action: "scan_software_registry" },
    { name: "License Verification", action: "check_license_availability" },
    { name: "IT Approval", condition: "is_paid_software" },
  ],
}

export default function AdminPage() {
  const router = useRouter()
  const { currentUser, processes, addProcess } = useGlobalState()
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProcess, setGeneratedProcess] = useState<Process | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "admin") {
    return null
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setSaved(false)
    setGeneratedProcess(null)

    setTimeout(() => {
      const lowerInput = input.toLowerCase()
      if (lowerInput.includes("firewall")) {
        setGeneratedProcess({ ...firewallJson, id: `firewall-${Date.now()}` })
      } else if (lowerInput.includes("software")) {
        setGeneratedProcess({ ...softwareJson, id: `software-${Date.now()}` })
      } else {
        // Default to a generic process
        setGeneratedProcess({
          id: `process-${Date.now()}`,
          name: "Generic Approval Process",
          description: "A custom approval workflow generated from your description.",
          fields: [
            {
              key: "request_details",
              label: "Request Details",
              type: "textarea",
              placeholder: "Describe your request...",
            },
          ],
          steps: [
            { name: "Initial Review", action: "auto_review" },
            { name: "Manager Approval", condition: "requires_approval" },
          ],
        })
      }
      setIsGenerating(false)
    }, 1500)
  }

  const handleSave = () => {
    if (generatedProcess) {
      addProcess(generatedProcess)
      setSaved(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Process Builder" />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">AI Process Builder</h1>
          <p className="text-muted-foreground">
            Describe your approval workflow in natural language and let AI generate the process definition.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Text to Process
                </CardTitle>
                <CardDescription>Describe your approval process in plain English</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the approval process (e.g., 'When someone requests a firewall change, check if the IP is trusted...')"
                  className="min-h-[180px] bg-input resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={isGenerating || !input.trim()} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Process
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-accent" />
                  Existing Processes
                </CardTitle>
                <CardDescription>
                  {processes.length} process{processes.length !== 1 ? "es" : ""} configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processes.map((process) => (
                    <div
                      key={process.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm">{process.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {process.fields.length} fields · {process.steps.length} steps
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                Generated Preview
              </CardTitle>
              <CardDescription>Review the generated process before saving</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedProcess ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg">{generatedProcess.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{generatedProcess.description}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      Form Fields
                      <Badge variant="secondary" className="text-xs">
                        {generatedProcess.fields.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {generatedProcess.fields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between p-2 rounded bg-input">
                          <span className="text-sm">{field.label}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {field.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      Workflow Steps
                      <Badge variant="secondary" className="text-xs">
                        {generatedProcess.steps.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {generatedProcess.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded bg-input">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{step.name}</span>
                            {step.action && <span className="text-xs text-muted-foreground ml-2">→ {step.action}</span>}
                            {step.condition && <span className="text-xs text-warning ml-2">if {step.condition}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saved}
                    className="w-full"
                    variant={saved ? "outline" : "default"}
                  >
                    {saved ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved to Processes
                      </>
                    ) : (
                      <>
                        Save Process
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Enter a description and click Generate to create a process
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
