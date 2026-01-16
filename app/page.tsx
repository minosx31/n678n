"use client"

import { useRouter } from "next/navigation"
import { useGlobalState } from "@/context/global-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, User, UserCheck, Workflow } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const { currentUser, setCurrentUser } = useGlobalState()

  const handleLogin = (role: "admin" | "employee" | "approver") => {
    const names = {
      admin: "Alex Admin",
      employee: "Emily Employee",
      approver: "Mike Manager",
    }
    setCurrentUser({ name: names[role], role })
    const routes = {
      admin: "/admin",
      employee: "/portal",
      approver: "/approvals",
    }
    router.push(routes[role])
  }

  if (currentUser) {
    const routes = {
      admin: "/admin",
      employee: "/portal",
      approver: "/approvals",
    }
    router.push(routes[currentUser.role!])
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Workflow className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Agentic Approvals</h1>
          </div>
          <p className="text-muted-foreground">AI-powered approval workflows for the modern enterprise</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Select Persona</CardTitle>
            <CardDescription>Choose a role to explore the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-primary/10 hover:border-primary bg-transparent"
              onClick={() => handleLogin("admin")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as IT Admin</div>
                <div className="text-xs text-muted-foreground">Build and manage approval processes</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-accent/10 hover:border-accent bg-transparent"
              onClick={() => handleLogin("employee")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as Employee</div>
                <div className="text-xs text-muted-foreground">Submit and track your requests</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-warning/10 hover:border-warning bg-transparent"
              onClick={() => handleLogin("approver")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <UserCheck className="h-5 w-5 text-warning" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as Manager</div>
                <div className="text-xs text-muted-foreground">Review and approve pending requests</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a simulated authentication for demo purposes
        </p>
      </div>
    </div>
  )
}
