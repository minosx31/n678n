"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useGlobalState } from "@/context/global-state"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const formatStatus = (status?: string) => {
  if (!status) return "Unknown"
  return status === "Human" ? "Needs Review" : status
}

export function RealtimeStatusToast() {
  const { currentUser } = useGlobalState()
  const { toast } = useToast()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const lastStatusByRequestId = useRef<Record<string, string>>({})

  useEffect(() => {
    let isCancelled = false

    const loadUserId = async () => {
      if (!currentUser?.name) {
        setCurrentUserId(null)
        return
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("name", currentUser.name)
          .limit(1)

        if (!isCancelled) {
          if (error) {
            setCurrentUserId(null)
            return
          }

          setCurrentUserId(data?.[0]?.id ?? null)
        }
      } catch {
        if (!isCancelled) {
          setCurrentUserId(null)
        }
      }
    }

    void loadUserId()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.name, supabase])

  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel("requests-status-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requests" },
        (payload) => {
          const previous = payload.old as { status?: string } | null
          const next = payload.new as {
            request_id?: string
            status?: string
            process_name?: string
            submitted_by?: string
          } | null

          if (!next?.request_id || !next.status) return

          if (previous?.status && previous.status === next.status) return

          if (currentUser.role === "employee") {
            if (!currentUserId || next.submitted_by !== currentUserId) return
          }

          const lastStatus = lastStatusByRequestId.current[next.request_id]
          if (lastStatus && lastStatus === next.status) return

          lastStatusByRequestId.current[next.request_id] = next.status

          const variant = 
            next.status === 'Approved' ? 'success' : 
            next.status === 'Rejected' ? 'destructive' : 
            'default'

          toast({
            variant: variant,
            title: "Received Decision!",
            description: `${next.request_id || "Request"} is now ${formatStatus(next.status)}.`,
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUser, currentUserId, supabase, toast])

  return null
}
