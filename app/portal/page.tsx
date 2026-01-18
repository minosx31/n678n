"use client"

import { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
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
  Bot,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Eye,
} from "lucide-react"

export default function PortalPage() {
  const router = useRouter()
  const { currentUser, processes, requests, addRequest } = useGlobalState()
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null)

  useEffect(() => {
    if (!currentUser || currentUser.role !== "employee") {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "employee") {
    return null
  }

  const myRequests = requests.filter((r) => r.submittedBy === currentUser.name)

  const handleSubmit = () => {
    if (!selectedProcess) return

    const now = new Date().toISOString()
    const newRequest: Request = {
      id: `req-${Date.now()}`,
      processId: selectedProcess.id,
      processName: selectedProcess.name,
      submittedBy: currentUser.name,
      submittedAt: now,
      status: "Pending",
      data: formData,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          timestamp: now,
          type: "submitted",
          title: "Request Submitted",
          description: "Your request has been submitted for processing",
          actor: currentUser.name,
          status: "completed",
        },
        {
          id: `evt-${Date.now() + 1}`,
          timestamp: new Date(Date.now() + 2000).toISOString(),
          type: "auto_check",
          title: "Automated Checks",
          description: "Running automated validation and risk assessment",
          status: "completed",
        },
        {
          id: `evt-${Date.now() + 2}`,
          timestamp: new Date(Date.now() + 5000).toISOString(),
          type: "pending_approval",
          title: "Pending Approval",
          description: "Waiting for manager review",
          status: "current",
        },
      ],
    }

    addRequest(newRequest)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelectedProcess(null)
      setFormData({})
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
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
    }
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    )
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "submitted":
        return <Send className="h-3 w-3" />
      case "auto_check":
        return <Bot className="h-3 w-3" />
      case "pending_approval":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <CheckCircle2 className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getTimelineColor = (status: string, type: string) => {
    if (status === "current") return "bg-warning text-warning-foreground"
    if (type === "approved") return "bg-success text-success-foreground"
    if (type === "rejected") return "bg-destructive text-destructive-foreground"
    return "bg-primary/20 text-primary"
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
                      key={process.id}
                      onClick={() => {
                        setSelectedProcess(process)
                        setFormData({})
                        setSubmitted(false)
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left cursor-pointer ${
                        selectedProcess?.id === process.id
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
                        {selectedProcess.fields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                id={field.key}
                                placeholder={field.placeholder}
                                value={formData[field.key] || ""}
                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                className="bg-input"
                              />
                            ) : field.type === "select" && field.options ? (
                              <Select
                                value={formData[field.key] || ""}
                                onValueChange={(value) => setFormData({ ...formData, [field.key]: value })}
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
                                id={field.key}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.key] || ""}
                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
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

      {/* View Request Details with Timeline */}
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

              {/* Request Details */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Request Details</h4>
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  {Object.entries(viewingRequest.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Process Timeline</h4>
                <div className="relative">
                  {viewingRequest.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${getTimelineColor(
                            event.status,
                            event.type
                          )}`}
                        >
                          {getTimelineIcon(event.type)}
                        </div>
                        {index < viewingRequest.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>

                      {/* Timeline content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.title}</p>
                          <div className="flex items-center gap-2">
                            {event.status === "current" && (
                              <Badge variant="secondary" className="text-xs">
                                In Progress
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        {event.actor && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {event.actor}
                          </p>
                        )}
                      </div>
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
