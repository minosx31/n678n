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

export interface TimelineEvent {
  id: string
  timestamp: string
  type: "submitted" | "auto_check" | "pending_approval" | "approved" | "rejected"
  title: string
  description?: string
  actor?: string
  status: "completed" | "current" | "pending"
}

export interface Request {
  id: string
  processId: string
  processName: string
  submittedBy: string
  submittedAt: string
  status: "Pending" | "Approved" | "Rejected"
  data: Record<string, string | number>
  remarks?: string
  decidedBy?: string
  decidedAt?: string
  timeline: TimelineEvent[]
}

interface GlobalState {
  currentUser: User | null
  processes: Process[]
  requests: Request[]
  setCurrentUser: (user: User | null) => void
  addProcess: (process: Process) => void
  updateProcess: (process: Process) => void
  deleteProcess: (id: string) => void
  addRequest: (request: Request) => void
  updateRequestStatus: (id: string, status: "Approved" | "Rejected", remarks?: string, decidedBy?: string) => void
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
    timeline: [
      {
        id: "evt-001",
        timestamp: "2026-01-14T10:30:00Z",
        type: "submitted",
        title: "Request Submitted",
        description: "Request was submitted for processing",
        actor: "John Doe",
        status: "completed",
      },
      {
        id: "evt-002",
        timestamp: "2026-01-14T10:30:05Z",
        type: "auto_check",
        title: "Inventory Check",
        description: "Checking available inventory for MacBook Pro",
        status: "completed",
      },
      {
        id: "evt-003",
        timestamp: "2026-01-14T10:30:10Z",
        type: "pending_approval",
        title: "Pending Manager Approval",
        description: "Cost exceeds $1500, requires manager approval",
        status: "current",
      },
    ],
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
    remarks: "Approved - replacement is justified",
    decidedBy: "Mike Manager",
    decidedAt: "2026-01-12T16:30:00Z",
    timeline: [
      {
        id: "evt-004",
        timestamp: "2026-01-12T14:15:00Z",
        type: "submitted",
        title: "Request Submitted",
        description: "Request was submitted for processing",
        actor: "Jane Smith",
        status: "completed",
      },
      {
        id: "evt-005",
        timestamp: "2026-01-12T14:15:05Z",
        type: "auto_check",
        title: "Inventory Check",
        description: "Dell XPS available in stock",
        status: "completed",
      },
      {
        id: "evt-006",
        timestamp: "2026-01-12T16:30:00Z",
        type: "approved",
        title: "Request Approved",
        description: "Approved - replacement is justified",
        actor: "Mike Manager",
        status: "completed",
      },
    ],
  },
]

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [processes, setProcesses] = useState<Process[]>(initialProcesses)
  const [requests, setRequests] = useState<Request[]>(initialRequests)

  const addProcess = (process: Process) => {
    setProcesses((prev) => [...prev, process])
  }

  const updateProcess = (process: Process) => {
    setProcesses((prev) => prev.map((p) => (p.id === process.id ? process : p)))
  }

  const deleteProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id))
  }

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request])
  }

  const updateRequestStatus = (id: string, status: "Approved" | "Rejected", remarks?: string, decidedBy?: string) => {
    setRequests((prev) => prev.map((req) => {
      if (req.id !== id) return req
      
      const now = new Date().toISOString()
      const newEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        timestamp: now,
        type: status === "Approved" ? "approved" : "rejected",
        title: status === "Approved" ? "Request Approved" : "Request Rejected",
        description: remarks,
        actor: decidedBy,
        status: "completed",
      }
      
      // Update pending events to completed
      const updatedTimeline = req.timeline.map(evt => 
        evt.status === "current" ? { ...evt, status: "completed" as const } : evt
      )
      
      return {
        ...req,
        status,
        remarks,
        decidedBy,
        decidedAt: now,
        timeline: [...updatedTimeline, newEvent],
      }
    }))
  }

  return (
    <GlobalStateContext.Provider
      value={{
        currentUser,
        processes,
        requests,
        setCurrentUser,
        addProcess,
        updateProcess,
        deleteProcess,
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
