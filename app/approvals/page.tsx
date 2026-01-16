"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGlobalState } from "@/context/global-state"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, CheckCircle2, XCircle, User, Calendar, FileText, ThumbsUp, ThumbsDown } from "lucide-react"

export default function ApprovalsPage() {
  const router = useRouter()
  const { currentUser, requests, updateRequestStatus } = useGlobalState()

  useEffect(() => {
    if (!currentUser || currentUser.role !== "approver") {
      router.push("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "approver") {
    return null
  }

  const pendingRequests = requests.filter((r) => r.status === "Pending")
  const processedRequests = requests.filter((r) => r.status !== "Pending")

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Approvals" />

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
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

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Review and take action on pending requests</CardDescription>
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
                      <Badge variant="secondary" className="text-xs">
                        {request.id}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid gap-2 mb-4">
                      {Object.entries(request.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                          <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => updateRequestStatus(request.id, "Approved")}>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                        onClick={() => updateRequestStatus(request.id, "Rejected")}
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
                <p className="text-sm text-muted-foreground mt-1">No pending requests to review</p>
              </div>
            )}
          </CardContent>
        </Card>

        {processedRequests.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Previously processed requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="font-medium text-sm">{request.processName}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.submittedBy} · {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={request.status === "Approved" ? "default" : "destructive"} className="text-xs">
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
