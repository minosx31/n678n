"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Process, type FormField, type RiskDefinition } from "@/context/global-state"
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

const FIELD_TYPES = ["text", "number", "textarea", "select", "email", "array", "file"] as const
export default function AdminPage() {
  const router = useRouter()
  const { currentUser, processes, addProcess, updateProcess, deleteProcess } = useGlobalState()
  const [activeTab, setActiveTab] = useState("create")
  const configApiUrl = process.env.NEXT_PUBLIC_CONFIG_API_URL
  
  // Create process state
  const [input, setInput] = useState("")
  const [referenceName, setReferenceName] = useState<string | null>(null)
  const [referenceText, setReferenceText] = useState<string>("")
  const [isReadingReference, setIsReadingReference] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProcess, setGeneratedProcess] = useState<Process | null>(null)
  const [generatedFields, setGeneratedFields] = useState<FormField[]>([])
  const [generatedRisks, setGeneratedRisks] = useState<RiskDefinition[]>([])
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
    risks: RiskDefinition[]
  }>({ name: "", description: "", fields: [], risks: [] })

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "admin") {
    return null
  }

  const getProcessKey = (process: Process) => process.processId || process.id || process.name
  const getProcessFields = (process: Process) => process.formDefinition?.fields ?? process.fields ?? []
  const getProcessRisks = (process: Process) => process.riskDefinitions ?? []

  const handleGenerate = async () => {
    setIsGenerating(true)
    setSaved(false)
    setGeneratedProcess(null)
    setGeneratedFields([])
    setGeneratedRisks([])

    try {
      const response = await fetch("/api/generate-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input, referenceText }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate process")
      }

      const data = await response.json()
      setGeneratedProcess(data.process)
      setGeneratedFields(getProcessFields(data.process))
      setGeneratedRisks(data.process.riskDefinitions || [])
    } catch (error) {
      console.error("Error generating process:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const samplePrompts = [
    {
      label: "Firewall change",
      text:
        "We need an approval process for firewall changes. Collect source IP, destination IP, port, protocol, and business justification. " +
        "Run automated IP reputation checks and flag high-risk ports (22, 3389) for security review. " +
        "Auto-approve low-risk requests; route medium risk to manager; high risk to security team.",
    },
    {
      label: "Software purchase",
      text:
        "We need a software purchase request process. Collect software name, vendor, cost, license type, and justification. " +
        "Check budget availability and license inventory. Auto-approve if cost < $500 and license is available; otherwise route to manager.",
    },
    {
      label: "Access to production",
      text:
        "We need an approval process for temporary production access. Collect user, system, duration, and justification. " +
        "Require manager approval if duration > 24 hours and security approval for admin access. Auto-approve low-risk read-only access.",
    },
    {
      label: "Vendor onboarding",
      text:
        "We need a vendor onboarding process. Collect vendor name, contract value, data access level, and compliance documents. " +
        "Run policy checks for data access and route high-risk vendors to security and legal review.",
    },
  ]

  const handleReferenceUpload = (file: File | null) => {
    if (!file) {
      setReferenceName(null)
      setReferenceText("")
      return
    }

    setIsReadingReference(true)
    setReferenceName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setReferenceText(result)
      setIsReadingReference(false)
    }
    reader.onerror = () => {
      setReferenceText("")
      setIsReadingReference(false)
    }
    reader.readAsText(file)
  }

  const handleSave = async () => {
    if (generatedProcess) {
      const updatedProcess: Process = {
        ...generatedProcess,
        formDefinition: {
          title: generatedProcess.formDefinition?.title || generatedProcess.name,
          description: generatedProcess.formDefinition?.description || generatedProcess.description,
          fields: generatedFields,
        },
        riskDefinitions: generatedRisks,
        fields: generatedFields,
      }
      if (configApiUrl) {
        try {
          await fetch(configApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              process: updatedProcess,
              referenceDocument: referenceName
                ? {
                    name: referenceName,
                    content: referenceText,
                  }
                : null,
            }),
          })
        } catch (error) {
          console.error("Failed to save process to config API:", error)
        }
      }
      addProcess(updatedProcess)
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
      fields: [...getProcessFields(process)],
      risks: [...getProcessRisks(process)],
    })
  }

  const handleSaveEdit = () => {
    if (editingProcess) {
      const updatedFormDefinition = editingProcess.formDefinition
        ? { ...editingProcess.formDefinition, fields: editForm.fields }
        : {
            title: editForm.name,
            description: editForm.description,
            fields: editForm.fields,
          }
      updateProcess({
        ...editingProcess,
        name: editForm.name,
        description: editForm.description,
        formDefinition: updatedFormDefinition,
        fields: editForm.fields,
        riskDefinitions: editForm.risks,
      })
      setEditingProcess(null)
    }
  }

  const handleDeleteProcess = (process: Process) => {
    setDeletingProcess(process)
  }

  const confirmDelete = () => {
    if (deletingProcess) {
      deleteProcess(deletingProcess.processId || deletingProcess.id || deletingProcess.name)
      setDeletingProcess(null)
    }
  }

  // Field editing helpers
  const addField = () => {
    const newField: FormField = {
      fieldId: `field${Date.now()}`,
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
      const normalized = updates.label
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean)
      const fieldId = normalized
        .map((word, i) => (i === 0 ? word.toLowerCase() : word[0]?.toUpperCase() + word.slice(1).toLowerCase()))
        .join("")
      newFields[index].fieldId = fieldId || newFields[index].fieldId
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

  // Risk editing helpers (existing process)
  const addEditRisk = () => {
    setEditForm((prev) => ({
      ...prev,
      risks: [
        ...prev.risks,
        {
          riskId: `RISK-${Date.now()}`,
          riskDefinition: "Describe how this risk is calculated",
          thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
          description: "",
        },
      ],
    }))
  }

  const updateEditRisk = (index: number, updates: Partial<RiskDefinition>) => {
    setEditForm((prev) => {
      const risks = [...prev.risks]
      risks[index] = { ...risks[index], ...updates }
      return { ...prev, risks }
    })
  }

  const updateEditRiskThreshold = (index: number, key: "low" | "medium" | "high", value: number) => {
    setEditForm((prev) => {
      const risks = [...prev.risks]
      risks[index] = {
        ...risks[index],
        thresholds: { ...risks[index].thresholds, [key]: value },
      }
      return { ...prev, risks }
    })
  }

  const removeEditRisk = (index: number) => {
    setEditForm((prev) => ({ ...prev, risks: prev.risks.filter((_, i) => i !== index) }))
  }

  // Generated review editing helpers
  const addGeneratedField = () => {
    const newField: FormField = {
      fieldId: `field${Date.now()}`,
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      placeholder: "",
      required: true,
    }
    setGeneratedFields((prev) => [...prev, newField])
  }

  const updateGeneratedField = (index: number, updates: Partial<FormField>) => {
    setGeneratedFields((prev) => {
      const newFields = [...prev]
      newFields[index] = { ...newFields[index], ...updates }
      if (updates.label) {
        const normalized = updates.label
          .trim()
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .split(/\s+/)
          .filter(Boolean)
        const fieldId = normalized
          .map((word, i) => (i === 0 ? word.toLowerCase() : word[0]?.toUpperCase() + word.slice(1).toLowerCase()))
          .join("")
        newFields[index].fieldId = fieldId || newFields[index].fieldId
        newFields[index].key = updates.label.toLowerCase().replace(/\s+/g, "_")
      }
      return newFields
    })
  }

  const removeGeneratedField = (index: number) => {
    setGeneratedFields((prev) => prev.filter((_, i) => i !== index))
  }

  const addGeneratedRisk = () => {
    setGeneratedRisks((prev) => [
      ...prev,
      {
        riskId: `RISK-${Date.now()}`,
        riskDefinition: "Describe how this risk is calculated",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "",
      },
    ])
  }

  const updateGeneratedRisk = (index: number, updates: Partial<RiskDefinition>) => {
    setGeneratedRisks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const updateGeneratedRiskThreshold = (
    index: number,
    key: "low" | "medium" | "high",
    value: number
  ) => {
    setGeneratedRisks((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        thresholds: {
          ...next[index].thresholds,
          [key]: value,
        },
      }
      return next
    })
  }

  const removeGeneratedRisk = (index: number) => {
    setGeneratedRisks((prev) => prev.filter((_, i) => i !== index))
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
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Not sure what to type? Use a starter prompt and edit it.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)]
                      setInput(randomPrompt.text)
                    }}
                  >
                    Use random sample prompt
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="reference-file">Reference file (optional)</Label>
                  <Input
                    id="reference-file"
                    type="file"
                    accept=".txt,.md,.json,.csv,.pdf"
                    onChange={(e) => handleReferenceUpload(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {isReadingReference
                        ? "Reading file..."
                        : referenceName
                          ? `Attached: ${referenceName}`
                          : "Attach a policy, checklist, or template to guide the LLM"}
                    </span>
                    {referenceName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReferenceUpload(null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isReadingReference || !input.trim()}
                  className="w-full sm:w-auto"
                >
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            Form Fields
                            <Badge variant="secondary" className="text-xs">
                              {generatedFields.length}
                            </Badge>
                          </h4>
                          <Button variant="outline" size="sm" onClick={addGeneratedField}>
                            <Plus className="mr-2 h-3 w-3" />
                            Add Field
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {generatedFields.map((field, index) => (
                            <div key={field.fieldId || field.key} className="p-3 rounded-lg border border-border bg-input/60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Field {index + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeGeneratedField(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Label</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateGeneratedField(index, { label: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Type</Label>
                                    <Select
                                      value={field.type}
                                      onValueChange={(value) =>
                                        updateGeneratedField(index, { type: value as FormField["type"] })
                                      }
                                    >
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
                                  <div className="space-y-1">
                                    <Label className="text-xs">Required</Label>
                                    <Select
                                      value={field.required ? "yes" : "no"}
                                      onValueChange={(value) => updateGeneratedField(index, { required: value === "yes" })}
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Placeholder</Label>
                                  <Input
                                    value={field.placeholder || ""}
                                    onChange={(e) => updateGeneratedField(index, { placeholder: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                {field.type === "select" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Options (comma-separated)</Label>
                                    <Input
                                      value={field.options?.join(", ") || ""}
                                      onChange={(e) =>
                                        updateGeneratedField(index, {
                                          options: e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                        })
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                )}
                                {field.type === "array" && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Item Type</Label>
                                    <Select
                                      value={field.itemType || "text"}
                                      onValueChange={(value) =>
                                        updateGeneratedField(index, { itemType: value as FormField["itemType"] })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {FIELD_TYPES.filter((type) => type !== "array" && type !== "textarea" && type !== "file").map((type) => (
                                          <SelectItem key={type} value={type} className="capitalize">
                                            {type}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {generatedFields.length === 0 && (
                            <p className="text-xs text-muted-foreground">No fields generated. Add one to continue.</p>
                          )}
                        </div>
                      </div>

                      {/* Risk Definitions */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            Risk Definitions
                            <Badge variant="secondary" className="text-xs">
                              {generatedRisks.length}
                            </Badge>
                          </h4>
                          <Button variant="outline" size="sm" onClick={addGeneratedRisk}>
                            <Plus className="mr-2 h-3 w-3" />
                            Add Risk
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {generatedRisks.map((risk, index) => (
                            <div key={risk.riskId} className="p-3 rounded-lg border border-border bg-input/60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Risk {index + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeGeneratedRisk(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Risk ID</Label>
                                  <Input
                                    value={risk.riskId}
                                    onChange={(e) => updateGeneratedRisk(index, { riskId: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Risk Definition</Label>
                                  <Textarea
                                    value={risk.riskDefinition}
                                    onChange={(e) => updateGeneratedRisk(index, { riskDefinition: e.target.value })}
                                    className="min-h-[70px] text-sm"
                                  />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Low</Label>
                                    <Input
                                      type="number"
                                      value={risk.thresholds.low}
                                      onChange={(e) => updateGeneratedRiskThreshold(index, "low", Number(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Medium</Label>
                                    <Input
                                      type="number"
                                      value={risk.thresholds.medium}
                                      onChange={(e) => updateGeneratedRiskThreshold(index, "medium", Number(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">High</Label>
                                    <Input
                                      type="number"
                                      value={risk.thresholds.high}
                                      onChange={(e) => updateGeneratedRiskThreshold(index, "high", Number(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    value={risk.description || ""}
                                    onChange={(e) => updateGeneratedRisk(index, { description: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {generatedRisks.length === 0 && (
                            <p className="text-xs text-muted-foreground">No risk definitions generated. Add one to continue.</p>
                          )}
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
                  <Card key={getProcessKey(process)} className="border-border bg-card hover:border-primary/50 transition-colors">
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
                          {getProcessFields(process).length} fields
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getProcessRisks(process).length} risks
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
                    {getProcessFields(viewingProcess).length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {getProcessFields(viewingProcess).map((field) => (
                    <div key={field.fieldId || field.key} className="flex items-center justify-between p-2 rounded bg-secondary/50">
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
                  Risk Definitions
                  <Badge variant="secondary" className="text-xs">
                    {getProcessRisks(viewingProcess).length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {getProcessRisks(viewingProcess).map((risk, index) => (
                    <div key={risk.riskId} className="p-3 rounded bg-secondary/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{risk.riskId}</span>
                        <span className="text-xs text-muted-foreground">Risk {index + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{risk.riskDefinition}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Thresholds: low {risk.thresholds.low}, medium {risk.thresholds.medium}, high {risk.thresholds.high}
                      </div>
                      {risk.description && <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>}
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

            {/* Risk Definitions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Risk Definitions</Label>
                <Button variant="outline" size="sm" onClick={addEditRisk}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Risk
                </Button>
              </div>
              <div className="space-y-3">
                {editForm.risks.map((risk, index) => (
                  <div key={risk.riskId} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium flex-1">Risk {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeEditRisk(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Risk ID</Label>
                        <Input
                          value={risk.riskId}
                          onChange={(e) => updateEditRisk(index, { riskId: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Risk Definition</Label>
                        <Textarea
                          value={risk.riskDefinition}
                          onChange={(e) => updateEditRisk(index, { riskDefinition: e.target.value })}
                          className="min-h-[70px] text-sm"
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Low</Label>
                          <Input
                            type="number"
                            value={risk.thresholds.low}
                            onChange={(e) => updateEditRiskThreshold(index, "low", Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Medium</Label>
                          <Input
                            type="number"
                            value={risk.thresholds.medium}
                            onChange={(e) => updateEditRiskThreshold(index, "medium", Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">High</Label>
                          <Input
                            type="number"
                            value={risk.thresholds.high}
                            onChange={(e) => updateEditRiskThreshold(index, "high", Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={risk.description || ""}
                          onChange={(e) => updateEditRisk(index, { description: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editForm.risks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No risk definitions added yet. Click &quot;Add Risk&quot; to create risk definitions.
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
