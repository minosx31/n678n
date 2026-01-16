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
import { FileText, Send, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react"

export default function PortalPage() {
  const router = useRouter()
  const { currentUser, processes, requests, addRequest } = useGlobalState()
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

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

    const newRequest: Request = {
      id: `req-${Date.now()}`,
      processId: selectedProcess.id,
      processName: selectedProcess.name,
      submittedBy: currentUser.name,
      submittedAt: new Date().toISOString(),
      status: "Pending",
      data: formData,
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
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
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
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50"
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
                        {getStatusBadge(request.status)}
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
    </div>
  )
}
