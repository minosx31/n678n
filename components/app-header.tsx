"use client"

import { useRouter } from "next/navigation"
import { useGlobalState } from "@/context/global-state"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Workflow } from "lucide-react"

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter()
  const { currentUser, setCurrentUser } = useGlobalState()

  const handleLogout = () => {
    setCurrentUser(null)
    router.push("/")
  }

  const roleLabels = {
    admin: "IT Admin",
    employee: "Employee",
    approver: "Manager",
  }

  return (
    <header className="border-b border-border bg-sidebar">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Workflow className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {currentUser?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.role && roleLabels[currentUser.role]}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
