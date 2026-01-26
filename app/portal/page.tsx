"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Process, type Request } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
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
  const { toast } = useToast()
  const [processes, setProcesses] = useState<Process[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({})
  const [submitted, setSubmitted] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null)
  const [auditLogData, setAuditLogData] = useState<string | null>(null)
  const [auditLogError, setAuditLogError] = useState<string | null>(null)
  const [auditLogLoading, setAuditLogLoading] = useState(false)
  const lastStatusByRequestId = useRef<Record<string, string>>({})
  const hasInitializedStatuses = useRef(false)

  const getProcessKey = (process: Process) => process.process_id || process.name
  const getProcessFields = (process: Process) => process.form_definition?.fields ?? []

  const fetchProcesses = useCallback(async () => {
    try {
      const response = await fetch("/api/processes")
      if (!response.ok) {
        throw new Error("Failed to load processes")
      }
      const data = await response.json()
      setProcesses(data.processes || [])
    } catch (error) {
      toast({
        title: "Unable to load processes",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchRequests = useCallback(async (submittedBy: string) => {
    try {
      const response = await fetch(`/api/requests?submitted_by=${encodeURIComponent(submittedBy)}`)
      if (!response.ok) {
        throw new Error("Failed to load requests")
      }
      const data = await response.json()
      const nextRequests: Request[] = data.requests || []
      setRequests(nextRequests)

      const myRequests = nextRequests.filter((request) => request.submitted_by === submittedBy)
      if (!hasInitializedStatuses.current) {
        lastStatusByRequestId.current = Object.fromEntries(
          myRequests.map((request) => [request.request_id, request.status])
        )
        hasInitializedStatuses.current = true
        return
      }

      myRequests.forEach((request) => {
        const previousStatus = lastStatusByRequestId.current[request.request_id]
        if (previousStatus && previousStatus !== request.status) {
          const displayStatus = request.status === "Human" ? "Needs Review" : request.status
          toast({
            title: "Decision received",
            description: `${request.process_name} is now ${displayStatus}.`,
          })
        }
        lastStatusByRequestId.current[request.request_id] = request.status
      })
    } catch (error) {
      toast({
        title: "Unable to load requests",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "employee") {
      router.push("/")
      return
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await Promise.all([
            fetchProcesses(),
            fetchRequests(currentUser.name),
          ])
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, router, fetchProcesses, fetchRequests])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "employee") {
      return
    }

    const intervalId = window.setInterval(() => {
      void fetchRequests(currentUser.name)
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [currentUser, fetchRequests])

  useEffect(() => {
    const auditUrl = viewingRequest?.audit_log_url
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
  }, [viewingRequest?.audit_log_url])

  if (!currentUser || currentUser.role !== "employee") {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Employee Portal" />
        <main className="p-6 max-w-6xl mx-auto space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-[360px] w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const myRequests = requests.filter((r) => r.submitted_by === currentUser.name)

  const uploadAttachments = async () => {
    if (!selectedProcess) return {}

    const uploads: Record<string, string> = {}
    const fileFields = getProcessFields(selectedProcess).filter((field) => field.type === "file")
    let failedUploads = 0

    for (const field of fileFields) {
      const fieldKey = field.field_id || field.key || ""
      if (!fieldKey) continue

      const file = fileUploads[fieldKey]
      if (!file) continue

      const body = new FormData()
      body.append("document", file, file.name)
      body.append("documentName", file.name)
      body.append("documentType", "supporting")
      body.append("processId", selectedProcess.process_id || selectedProcess.name)
      body.append("submittedBy", currentUser.name)
      body.append("fieldKey", fieldKey)

      const response = await fetch("/api/upload", { method: "POST", body })
      if (!response.ok) {
        failedUploads += 1
        continue
      }
      const data = await response.json()
      const url = data.url || (Array.isArray(data.urls) ? data.urls[0] : null)
      if (url) {
        uploads[fieldKey] = url
      }
    }

    if (failedUploads > 0) {
      toast({
        title: "Some uploads failed",
        description: `${failedUploads} attachment${failedUploads === 1 ? "" : "s"} could not be uploaded.`,
        variant: "destructive",
      })
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
      request_id: `req-${Date.now()}`,
      process_id: selectedProcess.process_id || selectedProcess.name,
      process_name: selectedProcess.name,
      submitted_by: currentUser.name,
      submitted_at: now,
      status: "Pending",
      data: requestData,
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process_id: newRequest.process_id,
        process_name: newRequest.process_name,
        submitted_by: newRequest.submitted_by,
        data: newRequest.data,
      }),
    })
    if (response.ok) {
      toast({
        title: "Request submitted",
        description: "Your request has been sent for review.",
      })
      await fetchRequests(currentUser.name)
    } else {
      const errorText = await response.text()
      toast({
        title: "Submission failed",
        description: errorText || "Please try again.",
        variant: "destructive",
      })
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
                          <div key={field.field_id || field.key} className="space-y-2">
                            <Label htmlFor={field.field_id || field.key}>{field.label}</Label>
                            {field.type === "file" ? (
                              <Input
                                id={field.field_id || field.key}
                                type="file"
                                accept={field.accept}
                                multiple={false}
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  setFileUploads({
                                    ...fileUploads,
                                    [field.field_id || field.key || ""]: file,
                                  })
                                }}
                                className="bg-input"
                              />
                            ) : field.type === "textarea" ? (
                              <Textarea
                                id={field.field_id || field.key}
                                placeholder={field.placeholder}
                                value={formData[field.field_id || field.key || ""] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.field_id || field.key || ""]: e.target.value })
                                }
                                className="bg-input"
                              />
                            ) : field.type === "select" && field.options ? (
                              <Select
                                value={formData[field.field_id || field.key || ""] || ""}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, [field.field_id || field.key || ""]: value })
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
                                id={field.field_id || field.key}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.field_id || field.key || ""] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.field_id || field.key || ""]: e.target.value })
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
                        key={request.request_id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                        onClick={() => setViewingRequest(request)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium">{request.process_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(request.submitted_at).toLocaleDateString()}
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
              {viewingRequest?.process_name}
            </DialogTitle>
            <DialogDescription>
              Request {viewingRequest?.request_id} · Submitted on{" "}
              {viewingRequest && new Date(viewingRequest.submitted_at).toLocaleDateString()}
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
                {viewingRequest.decided_by && viewingRequest.decided_at && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {viewingRequest.decided_by} · {new Date(viewingRequest.decided_at).toLocaleDateString()}
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

              {viewingRequest.audit_log_url && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Audit Log</h4>
                    <a
                      href={viewingRequest.audit_log_url}
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
