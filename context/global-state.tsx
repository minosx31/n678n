"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "admin" | "employee" | "approver" | null

export interface User {
  id?: string
  name: string
  email?: string
  role: UserRole
}

export interface FormField {
  field_id: string
  key?: string
  label: string
  type: "text" | "number" | "textarea" | "select" | "email" | "array" | "file"
  required?: boolean
  placeholder?: string
  options?: string[]
  item_type?: "text" | "number" | "email" | "select"
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
  form_definition_id?: string
  process_id?: string
  title: string
  description?: string
  fields: FormField[]
  version?: string
  created_at?: string
}

export interface PolicyDefinition {
  policy_id?: string
  process_id?: string
  policy_text: string
  type: "business-rule"
  severity: "high" | "medium" | "low"
  version?: string
  created_at?: string
}

export interface RiskDefinition {
  risk_id?: string
  process_id?: string
  risk_definition: string
  thresholds: {
    low: number
    medium: number
    high: number
  }
  description?: string
  version?: string
  created_at?: string
}

export interface AgentConfig {
  allow_human_override: boolean
  default_decision: "H" | "A" | "R"
  confidence_threshold: number
}

export interface Process {
  process_id: string
  created_at: string
  created_by?: string
  name: string
  description: string
  version: string
  form_definition?: FormDefinition
  policies?: PolicyDefinition[]
  risk_definitions?: RiskDefinition[]
  agent_config?: AgentConfig
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
  request_id: string
  dbId?: string
  process_id: string
  process_name: string
  submitted_by: string
  submitted_at: string
  status: "Pending" | "Approved" | "Rejected" | "Human"
  data: Record<string, string | number | string[]>
  remarks?: string
  decided_by?: string
  decided_at?: string
  audit_log_url?: string
  timeline?: TimelineEvent[]
}

interface GlobalState {
  currentUser: User | null
  processes: Process[]
  requests: Request[]
  setCurrentUser: (user: User | null) => void
  setProcesses: (processes: Process[]) => void
  addProcess: (process: Process) => void
  updateProcess: (process: Process) => void
  deleteProcess: (id: string) => void
  addRequest: (request: Request) => void
  updateRequestStatus: (id: string, status: "Approved" | "Rejected" | "Human", remarks?: string, decidedBy?: string) => void
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

const initialProcesses: Process[] = [
  {
    process_id: "laptop-request",
    created_at: "2026-01-10T09:00:00Z",
    created_by: "system",
    name: "Laptop Request",
    description: "Request a new laptop or laptop upgrade for your work needs.",
    version: "v1.0",
    form_definition: {
      form_definition_id: "form-laptop-request",
      process_id: "laptop-request",
      title: "Laptop Request",
      description: "Provide details for your laptop request.",
      version: "v1.0",
      created_at: "2026-01-10T09:00:00Z",
      fields: [
        {
          field_id: "laptop_type",
          key: "laptop_type",
          label: "Laptop Type",
          type: "select",
          options: ["MacBook Pro", "Dell XPS", "ThinkPad X1"],
          required: true,
        },
        {
          field_id: "specs",
          key: "specs",
          label: "Required Specifications",
          type: "text",
          placeholder: "e.g., 16GB RAM, 512GB SSD",
          required: true,
        },
        {
          field_id: "justification",
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
        policy_id: "policy-budget-001",
        process_id: "laptop-request",
        policy_text: "Requests over $1500 require manager approval.",
        type: "business-rule",
        severity: "high",
        version: "v1.0",
        created_at: "2026-01-10T09:00:00Z",
      },
    ],
    risk_definitions: [
      {
        risk_id: "risk-cost-001",
        process_id: "laptop-request",
        risk_definition: "Risk increases when cost exceeds budget thresholds.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Cost-based risk assessment for hardware requests.",
        version: "v1.0",
        created_at: "2026-01-10T09:00:00Z",
      },
    ],
    agent_config: {
      allow_human_override: true,
      default_decision: "H",
      confidence_threshold: 0.9,
    },
  },
  {
    process_id: "leave-approval",
    created_at: "2026-01-12T11:00:00Z",
    created_by: "system",
    name: "Leave Approval",
    description: "Request time off and route for approval.",
    version: "v1.0",
    form_definition: {
      form_definition_id: "form-leave-approval",
      process_id: "leave-approval",
      title: "Leave Request",
      description: "Provide details for your leave request.",
      version: "v1.0",
      created_at: "2026-01-12T11:00:00Z",
      fields: [
        {
          field_id: "leave_type",
          key: "leave_type",
          label: "Leave Type",
          type: "select",
          options: ["Annual Leave", "Sick Leave", "Unpaid Leave", "Bereavement"],
          required: true,
        },
        {
          field_id: "start_date",
          key: "start_date",
          label: "Start Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          field_id: "end_date",
          key: "end_date",
          label: "End Date",
          type: "text",
          placeholder: "YYYY-MM-DD",
          required: true,
        },
        {
          field_id: "reason",
          key: "reason",
          label: "Reason",
          type: "textarea",
          placeholder: "Provide a brief justification",
          required: true,
        },
        {
          field_id: "supporting_document",
          key: "supporting_document",
          label: "Supporting Document",
          type: "file",
          required: false,
        },
      ],
    },
    policies: [
      {
        policy_id: "policy-leave-001",
        process_id: "leave-approval",
        policy_text: "Leave requests exceeding 10 business days require senior approval.",
        type: "business-rule",
        severity: "medium",
        version: "v1.0",
        created_at: "2026-01-12T11:00:00Z",
      },
    ],
    risk_definitions: [
      {
        risk_id: "risk-coverage-001",
        process_id: "leave-approval",
        risk_definition: "Risk increases when team coverage falls below 60%.",
        thresholds: { low: 0.3, medium: 0.6, high: 1.0 },
        description: "Coverage-based risk assessment for leave.",
        version: "v1.0",
        created_at: "2026-01-12T11:00:00Z",
      },
    ],
    agent_config: {
      allow_human_override: true,
      default_decision: "H",
      confidence_threshold: 0.85,
    },
  },
]

const initialRequests: Request[] = [
  {
    request_id: "req-001",
    process_id: "laptop-request",
    process_name: "Laptop Request",
    submitted_by: "John Doe",
    submitted_at: "2026-01-14T10:30:00Z",
    status: "Pending",
    data: {
      laptop_type: "MacBook Pro",
      specs: "16GB RAM, 1TB SSD",
      justification: "Need a powerful machine for video editing and development work.",
    },
  },
  {
    request_id: "req-002",
    process_id: "laptop-request",
    process_name: "Laptop Request",
    submitted_by: "Jane Smith",
    submitted_at: "2026-01-12T14:15:00Z",
    status: "Approved",
    data: {
      laptop_type: "Dell XPS",
      specs: "8GB RAM, 256GB SSD",
      justification: "Replacement for damaged laptop.",
    },
    remarks: "Approved - replacement is justified",
    decided_by: "Mike Manager",
    decided_at: "2026-01-12T16:30:00Z",
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
    const targetId = process.process_id
    setProcesses((prev) =>
      prev.map((p) => (p.process_id === targetId ? process : p))
    )
  }

  const deleteProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.process_id !== id))
  }

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request])
  }

  const updateRequestStatus = (id: string, status: "Approved" | "Rejected" | "Human", remarks?: string, decidedBy?: string) => {
    setRequests((prev) => prev.map((req) => {
      if (req.request_id !== id) return req
      
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
        decided_by: decidedBy,
        decided_at: now,
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
        setProcesses,
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
