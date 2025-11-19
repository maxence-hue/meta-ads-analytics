"use client"

import { useEffect, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5001"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("meta-ads-token") : undefined
    const instance = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
    })

    instance.on("connect", () => {
      setConnected(true)
    })

    instance.on("disconnect", () => {
      setConnected(false)
    })

    setSocket(instance)

    return () => {
      instance.disconnect()
    }
  }, [])

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!socket) return () => {}
    
    socket.on(event, handler)
    
    // Return unsubscribe function
    return () => {
      socket.off(event, handler)
    }
  }, [socket])

  return { socket, connected, subscribe }
}

export function useGenerationProgress(jobId?: string) {
  const { socket, subscribe } = useSocket()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket || !jobId) return

    socket.emit("subscribe:job", jobId)

    const handleProgress = (payload: { jobId: string; progress: number }) => {
      if (payload.jobId === jobId) {
        setProgress(payload.progress)
        setStatus("processing")
      }
    }

    const handleSuccess = (payload: any) => {
      if (payload.jobId === jobId) {
        setStatus("completed")
        setResult(payload)
      }
    }

    const handleFailure = (payload: { jobId: string; error: string }) => {
      if (payload.jobId === jobId) {
        setStatus("failed")
        setError(payload.error)
      }
    }

    socket.on("job:progress", handleProgress)
    socket.on("creative:generated", handleSuccess)
    socket.on("creative:failed", handleFailure)

    return () => {
      socket.off("job:progress", handleProgress)
      socket.off("creative:generated", handleSuccess)
      socket.off("creative:failed", handleFailure)
      socket.emit("unsubscribe:job", jobId)
    }
  }, [socket, jobId])

  return { progress, status, result, error }
}
