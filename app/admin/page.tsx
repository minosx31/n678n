"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Process, type FormField, type WorkflowStep } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sparkles,
  Loader2,
  Check,
  FileText,
  ArrowRight,
  ListChecks,
  Eye,
  Pencil,
  Trash2,
  X,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

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

const FIELD_TYPES = ["text", "number", "textarea", "select"] as const
const ACTION_TYPES = [
  "verify_ip_reputation",
  "check_budget_availability",
  "check_software_license",
  "manager_approval",
  "security_team_approval",
  "auto_approve",
  "send_notification",
  "check_inventory",
] as const

export default function AdminPage() {
  const router = useRouter()
  const { currentUser, processes, addProcess, updateProcess, deleteProcess } = useGlobalState()
  const [activeTab, setActiveTab] = useState("create")
  
  // Create process state
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProcess, setGeneratedProcess] = useState<Process | null>(null)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  // View/Edit/Delete state
  const [viewingProcess, setViewingProcess] = useState<Process | null>(null)
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [deletingProcess, setDeletingProcess] = useState<Process | null>(null)
  
  // Edit form state (full editing)
  const [editForm, setEditForm] = useState<{
    name: string
    description: string
    fields: FormField[]
    steps: WorkflowStep[]
  }>({ name: "", description: "", fields: [], steps: [] })

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "admin") {
    return null
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setSaved(false)
    setGeneratedProcess(null)

    try {
      const response = await fetch("/api/generate-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate process")
      }

      const data = await response.json()
      setGeneratedProcess(data.process)
    } catch (error) {
      console.error("Error generating process:", error)
      const lowerInput = input.toLowerCase()
      if (lowerInput.includes("firewall")) {
        setGeneratedProcess({ ...firewallJson, id: `firewall-${Date.now()}` })
      } else if (lowerInput.includes("software")) {
        setGeneratedProcess({ ...softwareJson, id: `software-${Date.now()}` })
      } else {
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
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (generatedProcess) {
      addProcess(generatedProcess)
      setSaved(true)
      setTimeout(() => {
        setActiveTab("manage")
      }, 1000)
    }
  }

  const handleViewProcess = (process: Process) => {
    setViewingProcess(process)
  }

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process)
    setEditForm({
      name: process.name,
      description: process.description,
      fields: [...process.fields],
      steps: [...process.steps],
    })
  }

  const handleSaveEdit = () => {
    if (editingProcess) {
      updateProcess({
        ...editingProcess,
        name: editForm.name,
        description: editForm.description,
        fields: editForm.fields,
        steps: editForm.steps,
      })
      setEditingProcess(null)
    }
  }

  const handleDeleteProcess = (process: Process) => {
    setDeletingProcess(process)
  }

  const confirmDelete = () => {
    if (deletingProcess) {
      deleteProcess(deletingProcess.id)
      setDeletingProcess(null)
    }
  }

  // Field editing helpers
  const addField = () => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      placeholder: "",
    }
    setEditForm({ ...editForm, fields: [...editForm.fields, newField] })
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...editForm.fields]
    newFields[index] = { ...newFields[index], ...updates }
    if (updates.label) {
      newFields[index].key = updates.label.toLowerCase().replace(/\s+/g, "_")
    }
    setEditForm({ ...editForm, fields: newFields })
  }

  const removeField = (index: number) => {
    setEditForm({ ...editForm, fields: editForm.fields.filter((_, i) => i !== index) })
  }

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...editForm.fields]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newFields.length) return
    ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    setEditForm({ ...editForm, fields: newFields })
  }

  // Step editing helpers
  const addStep = () => {
    const newStep: WorkflowStep = {
      name: "New Step",
      action: undefined,
      condition: undefined,
    }
    setEditForm({ ...editForm, steps: [...editForm.steps, newStep] })
  }

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...editForm.steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setEditForm({ ...editForm, steps: newSteps })
  }

  const removeStep = (index: number) => {
    setEditForm({ ...editForm, steps: editForm.steps.filter((_, i) => i !== index) })
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...editForm.steps]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newSteps.length) return
    ;[newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
    setEditForm({ ...editForm, steps: newSteps })
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Process Builder" />

      <main className="p-6 max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">AI Process Builder</h1>
              <p className="text-muted-foreground text-sm">
                Create and manage approval workflows with AI assistance
              </p>
            </div>
            <TabsList className="bg-secondary">
              <TabsTrigger value="create" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="manage" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Manage
                {processes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {processes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CREATE TAB - Stacked Layout */}
          <TabsContent value="create" className="space-y-6">
            {/* Step 1: Input */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Describe Your Process
                    </CardTitle>
                    <CardDescription>Write in plain English what approval workflow you need</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Example: 'When someone requests a firewall change, first check if the IP is on our trusted list. If it's not trusted, route to the security team. If the port is sensitive (like 22 or 3389), require manager approval.'"
                  className="min-h-[120px] bg-input resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={isGenerating || !input.trim()} className="w-full sm:w-auto">
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

            {/* Step 2: Preview */}
            {generatedProcess && (
              <Card className="border-border bg-card border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        2
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-warning" />
                          Review Generated Process
                        </CardTitle>
                        <CardDescription>Verify the process before saving</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-muted-foreground"
                    >
                      {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {showPreview && (
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <h3 className="font-semibold text-lg">{generatedProcess.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{generatedProcess.description}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Fields */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          Form Fields
                          <Badge variant="secondary" className="text-xs">
                            {generatedProcess.fields.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {generatedProcess.fields.map((field) => (
                            <div key={field.key} className="flex items-center justify-between p-3 rounded-lg bg-input">
                              <span className="text-sm font-medium">{field.label}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {field.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Steps */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          Workflow Steps
                          <Badge variant="secondary" className="text-xs">
                            {generatedProcess.steps.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {generatedProcess.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-input">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">{step.name}</span>
                                {step.action && (
                                  <p className="text-xs text-muted-foreground truncate">→ {step.action}</p>
                                )}
                                {step.condition && (
                                  <p className="text-xs text-warning truncate">if {step.condition}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      onClick={handleSave}
                      disabled={saved}
                      className="w-full"
                      variant={saved ? "outline" : "default"}
                      size="lg"
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
                  </CardContent>
                )}
              </Card>
            )}

            {/* Empty state when no process generated */}
            {!generatedProcess && (
              <Card className="border-border bg-card border-dashed">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Describe your approval workflow above and click Generate to create a process configuration
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MANAGE TAB */}
          <TabsContent value="manage" className="space-y-4">
            {processes.length === 0 ? (
              <Card className="border-border bg-card border-dashed">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ListChecks className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">No processes yet</p>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create your first approval workflow to get started
                    </p>
                    <Button onClick={() => setActiveTab("create")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {processes.map((process) => (
                  <Card key={process.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{process.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {process.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {process.fields.length} fields
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {process.steps.length} steps
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewProcess(process)}>
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProcess(process)}>
                          <Pencil className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProcess(process)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* View Process Dialog */}
      <Dialog open={!!viewingProcess} onOpenChange={() => setViewingProcess(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {viewingProcess?.name}
            </DialogTitle>
            <DialogDescription>{viewingProcess?.description}</DialogDescription>
          </DialogHeader>

          {viewingProcess && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  Form Fields
                  <Badge variant="secondary" className="text-xs">
                    {viewingProcess.fields.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {viewingProcess.fields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <div>
                        <span className="text-sm font-medium">{field.label}</span>
                        {field.placeholder && <p className="text-xs text-muted-foreground">{field.placeholder}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  Workflow Steps
                  <Badge variant="secondary" className="text-xs">
                    {viewingProcess.steps.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {viewingProcess.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded bg-secondary/50">
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingProcess(null)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button
              onClick={() => {
                if (viewingProcess) {
                  handleEditProcess(viewingProcess)
                  setViewingProcess(null)
                }
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Process Dialog - Full Editing */}
      <Dialog open={!!editingProcess} onOpenChange={() => setEditingProcess(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Process
            </DialogTitle>
            <DialogDescription>Modify the process name, description, fields, and workflow steps</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="process-name">Process Name</Label>
                <Input
                  id="process-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter process name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="process-description">Description</Label>
                <Textarea
                  id="process-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter process description"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>

            <Separator />

            {/* Fields Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Form Fields</Label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {editForm.fields.map((field, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium flex-1">Field {index + 1}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => moveField(index, "up")} disabled={index === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveField(index, "down")}
                        disabled={index === editForm.fields.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeField(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Field label"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={field.type} onValueChange={(value) => updateField(index, { type: value as FormField["type"] })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="capitalize">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Optional placeholder text"
                          className="h-8 text-sm"
                        />
                      </div>
                      {field.type === "select" && (
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {editForm.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fields added yet. Click &quot;Add Field&quot; to create form fields.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Steps Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Workflow Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {editForm.steps.map((step, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium flex-1">Step {index + 1}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => moveStep(index, "up")} disabled={index === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === editForm.steps.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeStep(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Step Name</Label>
                        <Input
                          value={step.name}
                          onChange={(e) => updateStep(index, { name: e.target.value })}
                          placeholder="Step name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Action (optional)</Label>
                        <Select
                          value={step.action || ""}
                          onValueChange={(value) => updateStep(index, { action: value || undefined })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {ACTION_TYPES.map((action) => (
                              <SelectItem key={action} value={action}>
                                {action.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Condition (optional)</Label>
                        <Input
                          value={step.condition || ""}
                          onChange={(e) => updateStep(index, { condition: e.target.value || undefined })}
                          placeholder="e.g., cost > 1000"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editForm.steps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No steps added yet. Click &quot;Add Step&quot; to create workflow steps.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingProcess(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name.trim() || editForm.fields.length === 0}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProcess} onOpenChange={() => setDeletingProcess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Process</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingProcess?.name}? This action cannot be undone. Any existing requests using this process will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
