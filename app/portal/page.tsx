"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Process, type Request } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  MessageSquare,
  UserCheck,
  Eye,
} from "lucide-react"

export default function PortalPage() {
  const router = useRouter()
  const { currentUser } = useGlobalState()
  const [processes, setProcesses] = useState<Process[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [fileUploads, setFileUploads] = useState<Record<string, File[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null)
  const [auditLogData, setAuditLogData] = useState<string | null>(null)
  const [auditLogError, setAuditLogError] = useState<string | null>(null)
  const [auditLogLoading, setAuditLogLoading] = useState(false)

  const getProcessKey = (process: Process) => process.processId || process.id || process.name
  const getProcessFields = (process: Process) => process.formDefinition?.fields ?? process.fields ?? []

  const fetchProcesses = useCallback(async () => {
    const response = await fetch("/api/processes")
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setProcesses(data.processes || [])
  }, [])

  const fetchRequests = useCallback(async (submittedBy: string) => {
    const response = await fetch(`/api/requests?submittedBy=${encodeURIComponent(submittedBy)}`)
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setRequests(data.requests || [])
  }, [])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "employee") {
      router.push("/")
      return
    }

    const timeoutId = window.setTimeout(() => {
      void fetchProcesses()
      void fetchRequests(currentUser.name)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, router, fetchProcesses, fetchRequests])

  useEffect(() => {
    const auditUrl = viewingRequest?.auditLogUrl
    if (!auditUrl) {
      setAuditLogData(null)
      setAuditLogError(null)
      return
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setAuditLogLoading(true)
        setAuditLogError(null)
        try {
          const response = await fetch(auditUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch audit log (${response.status})`)
          }
          const data = await response.json()
          setAuditLogData(JSON.stringify(data, null, 2))
        } catch (error) {
          setAuditLogError(error instanceof Error ? error.message : "Failed to load audit log")
        } finally {
          setAuditLogLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [viewingRequest?.auditLogUrl])

  if (!currentUser || currentUser.role !== "employee") {
    return null
  }

  const myRequests = requests.filter((r) => r.submittedBy === currentUser.name)

  const uploadAttachments = async () => {
    if (!selectedProcess) return {}

    const uploads: Record<string, string[]> = {}
    const fileFields = getProcessFields(selectedProcess).filter((field) => field.type === "file")

    for (const field of fileFields) {
      const fieldKey = field.fieldId || field.key || ""
      if (!fieldKey) continue

      const files = fileUploads[fieldKey]
      if (!files || files.length === 0) continue

      const body = new FormData()
      body.append("processId", selectedProcess.processId || selectedProcess.id || selectedProcess.name)
      body.append("submittedBy", currentUser.name)
      body.append("fieldKey", fieldKey)
      files.forEach((file) => body.append("files", file, file.name))

      const response = await fetch("/api/uploads", { method: "POST", body })
      if (!response.ok) {
        continue
      }
      const data = await response.json()
      if (Array.isArray(data.urls) && data.urls.length > 0) {
        uploads[fieldKey] = data.urls
      }
    }

    return uploads
  }

  const handleSubmit = async () => {
    if (!selectedProcess) return

    const now = new Date().toISOString()
    const attachmentUrls = await uploadAttachments()
    const requestData = {
      ...formData,
      ...attachmentUrls,
    }
    const newRequest: Request = {
      id: `req-${Date.now()}`,
      processId: selectedProcess.processId || selectedProcess.id || selectedProcess.name,
      processName: selectedProcess.name,
      submittedBy: currentUser.name,
      submittedAt: now,
      status: "Pending",
      data: requestData,
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        processId: newRequest.processId,
        processName: newRequest.processName,
        submittedBy: newRequest.submittedBy,
        data: newRequest.data,
      }),
    })
    if (response.ok) {
      await fetchRequests(currentUser.name)
    }
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelectedProcess(null)
      setFormData({})
      setFileUploads({})
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-warning" />
      case "Approved":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "Rejected":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "Human":
        return <User className="h-4 w-4 text-primary" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
      Human: "outline",
    }
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Employee Portal" />

      <main className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="submit">Submit Request</TabsTrigger>
            <TabsTrigger value="my-requests">
              My Requests
              {myRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {myRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Available Processes</CardTitle>
                  <CardDescription>Select a process to submit a new request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {processes.map((process) => (
                    <button
                      key={getProcessKey(process)}
                      onClick={() => {
                        setSelectedProcess(process)
                        setFormData({})
                        setSubmitted(false)
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left cursor-pointer ${
                        (selectedProcess ? getProcessKey(selectedProcess) : "") === getProcessKey(process)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{process.name}</p>
                          <p className="text-xs text-muted-foreground">{process.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{selectedProcess ? selectedProcess.name : "Request Form"}</CardTitle>
                  <CardDescription>
                    {selectedProcess
                      ? "Fill out the form below to submit your request"
                      : "Select a process from the list to begin"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedProcess ? (
                    submitted ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <p className="font-medium">Request Submitted!</p>
                        <p className="text-sm text-muted-foreground mt-1">You can track its status in My Requests</p>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSubmit()
                        }}
                        className="space-y-4"
                      >
                        {getProcessFields(selectedProcess).map((field) => (
                          <div key={field.fieldId || field.key} className="space-y-2">
                            <Label htmlFor={field.fieldId || field.key}>{field.label}</Label>
                            {field.type === "file" ? (
                              <Input
                                id={field.fieldId || field.key}
                                type="file"
                                accept={field.accept}
                                multiple={field.multiple}
                                onChange={(e) => {
                                  const files = e.target.files ? Array.from(e.target.files) : []
                                  setFileUploads({
                                    ...fileUploads,
                                    [field.fieldId || field.key || ""]: files,
                                  })
                                }}
                                className="bg-input"
                              />
                            ) : field.type === "textarea" ? (
                              <Textarea
                                id={field.fieldId || field.key}
                                placeholder={field.placeholder}
                                value={formData[field.fieldId || field.key || ""] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.fieldId || field.key || ""]: e.target.value })
                                }
                                className="bg-input"
                              />
                            ) : field.type === "select" && field.options ? (
                              <Select
                                value={formData[field.fieldId || field.key || ""] || ""}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, [field.fieldId || field.key || ""]: value })
                                }
                              >
                                <SelectTrigger className="bg-input">
                                  <SelectValue placeholder={`Select ${field.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.fieldId || field.key}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.fieldId || field.key || ""] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.fieldId || field.key || ""]: e.target.value })
                                }
                                className="bg-input"
                              />
                            )}
                          </div>
                        ))}
                        <Button type="submit" className="w-full mt-6">
                          <Send className="mr-2 h-4 w-4" />
                          Submit Request
                        </Button>
                      </form>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Select a process to view its form</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-requests">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
                <CardDescription>Track the status of your submitted requests</CardDescription>
              </CardHeader>
              <CardContent>
                {myRequests.length > 0 ? (
                  <div className="space-y-3">
                    {myRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                        onClick={() => setViewingRequest(request)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium">{request.processName}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(request.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No requests submitted yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* View Request Details */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {viewingRequest?.processName}
            </DialogTitle>
            <DialogDescription>
              Request {viewingRequest?.id} · Submitted on{" "}
              {viewingRequest && new Date(viewingRequest.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {viewingRequest && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(viewingRequest.status)}
                  <span className="font-medium">{viewingRequest.status}</span>
                </div>
                {viewingRequest.decidedBy && viewingRequest.decidedAt && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {viewingRequest.decidedBy} · {new Date(viewingRequest.decidedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {viewingRequest.remarks && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Approver Remarks
                  </div>
                  <p className="text-sm text-muted-foreground">{viewingRequest.remarks}</p>
                </div>
              )}

              {viewingRequest.auditLogUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Audit Log</h4>
                    <a
                      href={viewingRequest.auditLogUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Open JSON
                    </a>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                    {auditLogLoading && <p className="text-muted-foreground">Loading audit log…</p>}
                    {!auditLogLoading && auditLogError && (
                      <p className="text-destructive">{auditLogError}</p>
                    )}
                    {!auditLogLoading && !auditLogError && auditLogData && (
                      <pre className="whitespace-pre-wrap break-words">{auditLogData}</pre>
                    )}
                    {!auditLogLoading && !auditLogError && !auditLogData && (
                      <p className="text-muted-foreground">No audit log data available.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Request Details */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Request Details</h4>
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  {Object.entries(viewingRequest.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="font-medium text-right max-w-[60%]">
                        {Array.isArray(value) ? value.join(", ") : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
