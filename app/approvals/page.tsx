"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState, type Request } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  UserCheck,
} from "lucide-react"

export default function ApprovalsPage() {
  const router = useRouter()
  const { currentUser } = useGlobalState()
  const [requests, setRequests] = useState<Request[]>([])
  
  // Confirmation modal state
  const [confirmingRequest, setConfirmingRequest] = useState<Request | null>(null)
  const [confirmAction, setConfirmAction] = useState<"Approved" | "Rejected" | null>(null)
  const [remarks, setRemarks] = useState("")
  
  // View request details
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null)
  const [auditLogData, setAuditLogData] = useState<string | null>(null)
  const [auditLogError, setAuditLogError] = useState<string | null>(null)
  const [auditLogLoading, setAuditLogLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    const response = await fetch("/api/requests")
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setRequests(data.requests || [])
  }, [])

  useEffect(() => {
    if (!currentUser || currentUser.role !== "approver") {
      router.push("/")
      return
    }

    const timeoutId = window.setTimeout(() => {
      void fetchRequests()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentUser, router, fetchRequests])

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

  if (!currentUser || currentUser.role !== "approver") {
    return null
  }

  const pendingRequests = requests.filter((r) => r.status === "Pending")
  const humanRequests = requests.filter((r) => r.status === "Human")

  const handleApproveClick = (request: Request) => {
    setConfirmingRequest(request)
    setConfirmAction("Approved")
    setRemarks("")
  }

  const handleRejectClick = (request: Request) => {
    setConfirmingRequest(request)
    setConfirmAction("Rejected")
    setRemarks("")
  }

  const handleConfirm = async () => {
    if (!confirmingRequest || !confirmAction) return

    const response = await fetch(`/api/requests/${confirmingRequest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: confirmAction,
        remarks: remarks.trim() || undefined,
        decidedBy: currentUser.name,
      }),
    })

    if (response.ok) {
      await fetchRequests()
    }

    setConfirmingRequest(null)
    setConfirmAction(null)
    setRemarks("")
  }

  const handleViewRequest = (request: Request) => {
    setViewingRequest(request)
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

  const getDisplayStatus = (status: string) => (status === "Human" ? "Needs Review" : status)

  const getStatusBadge = (status: string) => {
    const displayStatus = getDisplayStatus(status)
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
      "Needs Review": "outline",
    }

    return (
      <Badge variant={variants[displayStatus] || "secondary"} className="text-xs">
        {displayStatus}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Approvals" />

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{humanRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Human Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requests.filter((r) => r.status === "Approved").length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requests.filter((r) => r.status === "Rejected").length}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="needs-review" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="needs-review">
              Needs Review
              {(humanRequests.length + pendingRequests.length) > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {humanRequests.length + pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-requests">All Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="needs-review" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Human Decisions
                </CardTitle>
                <CardDescription>These requests require a manual decision.</CardDescription>
              </CardHeader>
              <CardContent>
                {humanRequests.length > 0 ? (
                  <div className="space-y-4">
                    {humanRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border border-border bg-secondary/50">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold">{request.processName}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {request.submittedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(request.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                              className="text-muted-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Badge variant="secondary" className="text-xs">
                              {request.id}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid gap-2 mb-4">
                          {Object.entries(request.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                              <span className="font-medium text-right max-w-[60%] truncate">
                                {Array.isArray(value) ? value.join(", ") : value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 hover:bg-primary/70"
                            onClick={() => handleApproveClick(request)}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-destructive/50 text-primary-foreground hover:bg-destructive/70 bg-destructive"
                            onClick={() => handleRejectClick(request)}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm text-muted-foreground mt-1">No human decisions needed right now</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Requests
                </CardTitle>
                <CardDescription>Agent decisions can still be overridden.</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border border-border bg-secondary/50">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold">{request.processName}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {request.submittedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(request.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRequest(request)}
                              className="text-muted-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Badge variant="secondary" className="text-xs">
                              {request.id}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid gap-2 mb-4">
                          {Object.entries(request.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                              <span className="font-medium text-right max-w-[60%] truncate">
                                {Array.isArray(value) ? value.join(", ") : value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 hover:bg-primary/70"
                            onClick={() => handleApproveClick(request)}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-destructive/50 text-primary-foreground hover:bg-destructive/70 bg-destructive"
                            onClick={() => handleRejectClick(request)}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium">No pending requests</p>
                    <p className="text-sm text-muted-foreground mt-1">Everything has been reviewed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-requests">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>All Requests</CardTitle>
                <CardDescription>Review any request and override agent decisions.</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length > 0 ? (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleViewRequest(request)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium text-sm">{request.processName}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.submittedBy} · {new Date(request.submittedAt).toLocaleDateString()}
                            </p>
                            {request.remarks && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MessageSquare className="h-3 w-3" />
                                {request.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No requests yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Requests will appear here once submitted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Approval/Rejection Confirmation Modal */}
      <Dialog
        open={!!confirmingRequest && !!confirmAction}
        onOpenChange={() => {
          setConfirmingRequest(null)
          setConfirmAction(null)
          setRemarks("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === "Approved" ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-success" />
                  Approve Request
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-destructive" />
                  Reject Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "Approved"
                ? "You are about to approve this request. Add optional remarks below."
                : "You are about to reject this request. Consider adding remarks to explain why."}
            </DialogDescription>
          </DialogHeader>

          {confirmingRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{confirmingRequest.processName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted by {confirmingRequest.submittedBy} on{" "}
                  {new Date(confirmingRequest.submittedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Remarks (optional)
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    confirmAction === "Approved"
                      ? "e.g., Approved - meets all requirements"
                      : "e.g., Rejected - insufficient justification provided"
                  }
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmingRequest(null)
                setConfirmAction(null)
                setRemarks("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={confirmAction === "Approved" ? "default" : "destructive"}
            >
              {confirmAction === "Approved" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Approval
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Details */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {viewingRequest?.processName}
            </DialogTitle>
            <DialogDescription>
              Request {viewingRequest?.id} · Submitted by {viewingRequest?.submittedBy}
            </DialogDescription>
          </DialogHeader>

          {viewingRequest && (
            <div className="space-y-4">
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

              {/* Status & Decision */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(viewingRequest.status)}
                  <span className="font-medium">{getDisplayStatus(viewingRequest.status)}</span>
                </div>
                {viewingRequest.decidedBy && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {viewingRequest.decidedBy}
                  </div>
                )}
              </div>

              {viewingRequest.remarks && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <MessageSquare className="h-4 w-4" />
                    Remarks
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

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRequest(null)}>
              Close
            </Button>
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  if (viewingRequest) {
                    handleRejectClick(viewingRequest)
                    setViewingRequest(null)
                  }
                }}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  if (viewingRequest) {
                    handleApproveClick(viewingRequest)
                    setViewingRequest(null)
                  }
                }}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
