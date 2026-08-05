"use client"

/**
 * Encanamento de rastreamento portado da v2 sem alteração de lógica: já foi
 * validado ponta a ponta (pixel + CAPI deduplicando por event_id, enhanced
 * conversions do Google a partir do state e nunca raspando o DOM).
 *
 * Virou módulo em vez de <script> inline porque o formulário agora é React e
 * precisa chamar `base()` e `novoEventId()` diretamente.
 */

import { MYTHOS } from "@/lib/mythos"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    MYTHOS_FORCAR_ANIMACAO?: boolean
  }
}

type Geo = {
  ip?: string
  city?: string
  region?: string
  postal?: string
  country?: string
}

let utms: Record<string, string> = {}
let ids: Record<string, string> = {}
let geo: Geo = {}
let iniciado = false

function cookie(n: string): string {
  const m = document.cookie.match(new RegExp("(^| )" + n + "=([^;]+)"))
  return m ? decodeURIComponent(m[2]) : ""
}

export function novoEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/* guarda o que veio na URL e devolve o que já estava salvo quando a URL vem
   limpa — o visitante pode chegar pelo anúncio e só converter na 3ª visita */
function store(chave: string, chaves: string[]): Record<string, string> {
  const p = new URLSearchParams(location.search)
  const achou: Record<string, string> = {}
  let algum = false
  chaves.forEach((k) => {
    const v = p.get(k)
    if (v) {
      achou[k] = v
      algum = true
    }
  })
  if (algum) {
    try {
      localStorage.setItem(chave, JSON.stringify(achou))
    } catch {}
  }
  let salvo: Record<string, string> = {}
  try {
    salvo = JSON.parse(localStorage.getItem(chave) || "{}")
  } catch {}
  return algum ? achou : salvo
}

export function iniciarTracking() {
  if (iniciado || typeof window === "undefined") return
  iniciado = true

  utms = store("_mythos_utms", [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ])
  ids = store("_mythos_ids", [
    "fbclid",
    "gclid",
    "gbraid",
    "wbraid",
    "ttclid",
    "msclkid",
  ])

  // o endpoint é Apps Script e não enxerga o IP do visitante: vem do browser
  try {
    geo = JSON.parse(sessionStorage.getItem("_mythos_geo") || "{}")
  } catch {}
  if (!geo.ip) {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        geo = {
          ip: d.ip || "",
          city: d.city || "",
          region: d.region_code || "",
          postal: d.postal || "",
          country: d.country_code || "",
        }
        try {
          sessionStorage.setItem("_mythos_geo", JSON.stringify(geo))
        } catch {}
      })
      .catch(() => {})
  }

  if (MYTHOS.PIXEL_ID) {
    /* eslint-disable */
    // O `!` do snippet oficial da Meta some aqui: em TS ele vira "testar void
    // por veracidade" (TS1345). A IIFE entre parênteses já é expressão válida.
    // prettier-ignore
    ;(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
      if (!f._fbq) f._fbq = n
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
    /* eslint-enable */
    window.fbq?.("init", MYTHOS.PIXEL_ID)
    // init sozinho não cria o cookie _fbp
    window.fbq?.("track", "PageView", {}, { eventID: novoEventId() })
  } else {
    window.fbq = window.fbq || (() => {})
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  if (MYTHOS.ADS_ID || MYTHOS.GA4_ID) {
    const s = document.createElement("script")
    s.async = true
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      (MYTHOS.ADS_ID || MYTHOS.GA4_ID)
    document.head.appendChild(s)
    window.gtag("js", new Date())
    // grava _gcl_aw (papel do Conversion Linker)
    if (MYTHOS.ADS_ID) window.gtag("config", MYTHOS.ADS_ID)
    if (MYTHOS.GA4_ID) window.gtag("config", MYTHOS.GA4_ID)
  }
}

export function basePayload(): Record<string, string> {
  let fbc = cookie("_fbc")
  if (!fbc && ids.fbclid) fbc = "fb.1." + Date.now() + "." + ids.fbclid
  return {
    utm_source: utms.utm_source || "",
    utm_medium: utms.utm_medium || "",
    utm_campaign: utms.utm_campaign || "",
    utm_term: utms.utm_term || "",
    utm_content: utms.utm_content || "",
    fbclid: ids.fbclid || "",
    gclid: ids.gclid || "",
    gbraid: ids.gbraid || "",
    wbraid: ids.wbraid || "",
    ttclid: ids.ttclid || "",
    msclkid: ids.msclkid || "",
    fbp: cookie("_fbp"),
    fbc,
    page_url: location.href,
    referrer: document.referrer,
    language: navigator.language,
    screen: screen.width + "x" + screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    user_agent: navigator.userAgent,
    ip: geo.ip || "",
    city: geo.city || "",
    region: geo.region || "",
    postal: geo.postal || "",
    country: geo.country || "BR",
    variante: MYTHOS.VARIANTE,
  }
}

export function urlWhatsApp(): string {
  if (!MYTHOS.WHATSAPP) return ""
  const origem = utms.utm_campaign ? ` (vim de: ${utms.utm_campaign})` : ""
  return (
    "https://wa.me/" +
    MYTHOS.WHATSAPP +
    "?text=" +
    encodeURIComponent(
      "Olá! Vim pelo site da Mythos e quero falar sobre marketing pro meu negócio." +
        origem
    )
  )
}
