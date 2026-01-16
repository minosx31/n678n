"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "admin" | "employee" | "approver" | null

export interface User {
  name: string
  role: UserRole
}

export interface FormField {
  key: string
  label: string
  type: "text" | "number" | "textarea" | "select"
  placeholder?: string
  options?: string[]
}

export interface WorkflowStep {
  name: string
  action?: string
  condition?: string
}

export interface Process {
  id: string
  name: string
  description: string
  fields: FormField[]
  steps: WorkflowStep[]
}

export interface Request {
  id: string
  processId: string
  processName: string
  submittedBy: string
  submittedAt: string
  status: "Pending" | "Approved" | "Rejected"
  data: Record<string, string | number>
}

interface GlobalState {
  currentUser: User | null
  processes: Process[]
  requests: Request[]
  setCurrentUser: (user: User | null) => void
  addProcess: (process: Process) => void
  addRequest: (request: Request) => void
  updateRequestStatus: (id: string, status: "Approved" | "Rejected") => void
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

const initialProcesses: Process[] = [
  {
    id: "laptop-request",
    name: "Laptop Request",
    description: "Request a new laptop or laptop upgrade for your work needs.",
    fields: [
      { key: "laptop_type", label: "Laptop Type", type: "select", options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"] },
      { key: "specs", label: "Required Specifications", type: "text", placeholder: "e.g., 16GB RAM, 512GB SSD" },
      {
        key: "justification",
        label: "Business Justification",
        type: "textarea",
        placeholder: "Explain why you need this laptop...",
      },
    ],
    steps: [
      { name: "IT Review", action: "check_inventory" },
      { name: "Manager Approval", condition: "cost > 1500" },
    ],
  },
]

const initialRequests: Request[] = [
  {
    id: "req-001",
    processId: "laptop-request",
    processName: "Laptop Request",
    submittedBy: "John Doe",
    submittedAt: "2026-01-14T10:30:00Z",
    status: "Pending",
    data: {
      laptop_type: "MacBook Pro",
      specs: "16GB RAM, 1TB SSD",
      justification: "Need a powerful machine for video editing and development work.",
    },
  },
  {
    id: "req-002",
    processId: "laptop-request",
    processName: "Laptop Request",
    submittedBy: "Jane Smith",
    submittedAt: "2026-01-12T14:15:00Z",
    status: "Approved",
    data: {
      laptop_type: "Dell XPS",
      specs: "8GB RAM, 256GB SSD",
      justification: "Replacement for damaged laptop.",
    },
  },
]

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [processes, setProcesses] = useState<Process[]>(initialProcesses)
  const [requests, setRequests] = useState<Request[]>(initialRequests)

  const addProcess = (process: Process) => {
    setProcesses((prev) => [...prev, process])
  }

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request])
  }

  const updateRequestStatus = (id: string, status: "Approved" | "Rejected") => {
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)))
  }

  return (
    <GlobalStateContext.Provider
      value={{
        currentUser,
        processes,
        requests,
        setCurrentUser,
        addProcess,
        addRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  )
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider")
  }
  return context
}
