"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "admin" | "employee" | "approver" | null

export interface User {
  name: string
  role: UserRole
}

export interface FormField {
  fieldId: string
  key?: string
  label: string
  type: "text" | "number" | "textarea" | "select" | "email" | "array" | "file"
  required?: boolean
  placeholder?: string
  options?: string[]
  itemType?: "text" | "number" | "email" | "select"
  multiple?: boolean
  accept?: string
  validation?: {
    maxLength?: number
    min?: number
    max?: number
  }
}

export interface WorkflowStep {
  name: string
  action?: string
  condition?: string
}

export interface FormDefinition {
  title: string
  description?: string
  fields: FormField[]
}

export interface PolicyDefinition {
  policyId: string
  policyText: string
  type: "business-rule"
  severity: "high" | "medium" | "low"
}

export interface RiskDefinition {
  riskId: string
  riskDefinition: string
  thresholds: {
    low: number
    medium: number
    high: number
  }
  description?: string
}

export interface AgentConfig {
  allowHumanOverride: boolean
  defaultDecision: "H" | "A" | "R"
  confidenceThreshold: number
}

export interface Process {
  processId: string
  createdAt: string
  name: string
  description: string
  version: string
  formDefinition: FormDefinition
  policies: PolicyDefinition[]
  riskDefinitions: RiskDefinition[]
  agentConfig: AgentConfig
  // Legacy compatibility
  id?: string
  fields?: FormField[]
  steps?: WorkflowStep[]
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
  status: "Pending" | "Approved" | "Rejected" | "Human"
  data: Record<string, string | number | string[]>
  remarks?: string
  decidedBy?: string
  decidedAt?: string
  auditLogUrl?: string
  timeline?: TimelineEvent[]
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
  updateRequestStatus: (id: string, status: "Approved" | "Rejected" | "Human", remarks?: string, decidedBy?: string) => void
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

const initialProcesses: Process[] = [
  {
    processId: "laptop-request",
    createdAt: "2026-01-10T09:00:00Z",
    name: "Laptop Request",
    description: "Request a new laptop or laptop upgrade for your work needs.",
    version: "v1.0",
    formDefinition: {
      title: "Laptop Request",
      description: "Provide details for your laptop request.",
      fields: [
        {
          fieldId: "laptopType",
          key: "laptop_type",
          label: "Laptop Type",
          type: "select",
          options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"],
          required: true,
        },
        {
          fieldId: "specs",
          key: "specs",
          label: "Required Specifications",
          type: "text",
          placeholder: "e.g., 16GB RAM, 512GB SSD",
          required: true,
        },
        {
          fieldId: "justification",
          key: "justification",
          label: "Business Justification",
          type: "textarea",
          placeholder: "Explain why you need this laptop...",
          required: true,
        },
      ],
    },
    policies: [
      {
        policyId: "POLICY-BUDGET-001",
        policyText: "Requests over $1500 require manager approval.",
        type: "business-rule",
        severity: "high",
      },
    ],
    riskDefinitions: [
      {
        riskId: "RISK-COST-001",
        riskDefinition: "Risk increases when cost exceeds budget thresholds.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Cost-based risk assessment for hardware requests.",
      },
    ],
    agentConfig: {
      allowHumanOverride: true,
      defaultDecision: "H",
      confidenceThreshold: 0.9,
    },
    // Legacy compatibility
    id: "laptop-request",
    fields: [
      { fieldId: "laptopType", key: "laptop_type", label: "Laptop Type", type: "select", options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"] },
      { fieldId: "specs", key: "specs", label: "Required Specifications", type: "text", placeholder: "e.g., 16GB RAM, 512GB SSD" },
      {
        fieldId: "justification",
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
    const targetId = process.processId || process.id
    setProcesses((prev) =>
      prev.map((p) => (p.processId === targetId || p.id === targetId ? process : p))
    )
  }

  const deleteProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.processId !== id && p.id !== id))
  }

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request])
  }

  const updateRequestStatus = (id: string, status: "Approved" | "Rejected" | "Human", remarks?: string, decidedBy?: string) => {
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
      
      const baseTimeline = req.timeline ?? []

      // Update pending events to completed
      const updatedTimeline = baseTimeline.map((evt) =>
        evt.status === "current" ? { ...evt, status: "completed" as const } : evt
      )
      
      return {
        ...req,
        status,
        remarks,
        decidedBy,
        decidedAt: now,
        timeline: updatedTimeline.length > 0 ? [...updatedTimeline, newEvent] : [newEvent],
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
