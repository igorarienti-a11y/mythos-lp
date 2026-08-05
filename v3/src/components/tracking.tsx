"use client"

import { useEffect } from "react"

import { iniciarTracking } from "@/lib/tracking"

/** Só liga o encanamento no cliente. Não renderiza nada. */
export function Tracking() {
  useEffect(() => {
    iniciarTracking()
  }, [])
  return null
}
