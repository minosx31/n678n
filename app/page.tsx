"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useGlobalState } from "@/context/global-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, User, UserCheck, Workflow } from "lucide-react"

const roleConfig = {
  admin: { name: "Alex Admin", route: "/admin" },
  employee: { name: "Emily Employee", route: "/portal" },
  approver: { name: "Mike Manager", route: "/approvals" },
}

type UserRecord = {
  id: string
  name: string
  role: keyof typeof roleConfig
}

export default function LandingPage() {
  const router = useRouter()
  const { currentUser, setCurrentUser } = useGlobalState()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const usersByRole = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.role] = acc[user.role] ? [...acc[user.role], user] : [user]
        return acc
      },
      {} as Record<keyof typeof roleConfig, UserRecord[]>
    )
  }, [users])

  const getRoleUser = (role: keyof typeof roleConfig) => {
    const roleUsers = usersByRole[role]
    return roleUsers && roleUsers.length > 0 ? roleUsers[0] : null
  }

  const getRoleName = (role: keyof typeof roleConfig) => {
    return getRoleUser(role)?.name ?? roleConfig[role].name
  }

  useEffect(() => {
    if (currentUser?.role) {
      router.push(roleConfig[currentUser.role].route)
    }
  }, [currentUser, router])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/users")
          if (!response.ok) {
            return
          }
          const data = await response.json()
          setUsers(data.users || [])
        } finally {
          setIsLoading(false)
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const handleSetUser = (role: "admin" | "employee" | "approver") => {
    setCurrentUser({ name: getRoleName(role), role })
  }

  if (currentUser) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <Skeleton className="h-10 w-40 mx-auto" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Workflow className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">n678n Agentic Approval Platform</h1>
          </div>
          <p className="text-muted-foreground">AI-powered approval workflows for the modern enterprise</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Select Persona</CardTitle>
            <CardDescription>Choose a role to explore the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin"
              onClick={() => handleSetUser("admin")}
              className="w-full flex items-center justify-start gap-4 p-2 rounded-md border border-input hover:bg-primary/10 hover:border-primary bg-transparent transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as Admin</div>
                <div className="text-xs text-muted-foreground">Build and manage approval processes</div>
                <div className="text-xs text-muted-foreground">{getRoleName("admin")}</div>
              </div>
            </Link>

            <Link
              href="/portal"
              onClick={() => handleSetUser("employee")}
              className="w-full flex items-center justify-start gap-4 p-2 rounded-md border border-input hover:bg-success/10 hover:border-success bg-transparent transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <User className="h-5 w-5 text-foreground" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as Requester</div>
                <div className="text-xs text-muted-foreground">Submit and track your requests</div>
                <div className="text-xs text-muted-foreground">{getRoleName("employee")}</div>
              </div>
            </Link>

            <Link
              href="/approvals"
              onClick={() => handleSetUser("approver")}
              className="w-full flex items-center justify-start gap-4 p-2 rounded-md border border-input hover:bg-warning/10 hover:border-warning bg-transparent transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <UserCheck className="h-5 w-5 text-warning" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Login as Approver</div>
                <div className="text-xs text-muted-foreground">Review and approve pending requests</div>
                <div className="text-xs text-muted-foreground">{getRoleName("approver")}</div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a simulated authentication for demo purposes
        </p>
      </div>
    </div>
  )
}
