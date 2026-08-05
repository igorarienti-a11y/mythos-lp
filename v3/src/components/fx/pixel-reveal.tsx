"use client"

/**
 * Pixel dissolve no espírito do `pixelreveal` do OriginKit: uma grade de
 * quadrados cobre o conteúdo e se apaga em varredura com borda irregular,
 * revelando o que está embaixo.
 *
 * Reescrito em canvas 2D sobre o conteúdo real em vez de sobre uma imagem —
 * assim o número e as barras do case continuam sendo texto/DOM (animáveis pelo
 * GSAP, selecionáveis, acessíveis) e o pixel só passa por cima.
 *
 * Cuidados que o efeito exige:
 * - `pointer-events:none` no canvas, senão ele engole o clique do bloco.
 * - Sai do ar sozinho ao terminar (`display:none`), para não segurar uma
 *   camada de composição viva pelo resto da página.
 * - Não roda com movimento reduzido e não roda em tela pequena: é canvas cheio
 *   redesenhado a cada frame, e no celular o custo não paga o efeito.
 */

import { useEffect, useRef } from "react"

export type PixelRevealProps = {
  /** aresta do quadrado em px */
  cell?: number
  /** duração da varredura em ms */
  duration?: number
  /** cor dos quadrados */
  color?: string
  /** direção da varredura */
  direction?: "up" | "down" | "left" | "right"
  /** quanto a borda da varredura serrilha (0 = reta, 1 = muito irregular) */
  roughness?: number
  className?: string
}

export function PixelReveal({
  cell = 14,
  duration = 1100,
  color = "#F2EEF5",
  direction = "left",
  roughness = 0.55,
  className,
}: PixelRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const host = canvas.parentElement
    if (!host) return

    const forcar = (window as { MYTHOS_FORCAR_ANIMACAO?: boolean })
      .MYTHOS_FORCAR_ANIMACAO
    const reduzido =
      !forcar && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    /* abaixo de 700px o bloco já ocupa a tela toda: o dissolve vira custo puro */
    if (reduzido || window.innerWidth < 700) {
      canvas.style.display = "none"
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let ruido: number[] = []

    const medir = () => {
      const r = host.getBoundingClientRect()
      w = Math.ceil(r.width)
      h = Math.ceil(r.height)
      canvas.width = Math.ceil(w * dpr)
      canvas.height = Math.ceil(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / cell)
      rows = Math.ceil(h / cell)
      /* o ruído é sorteado UMA vez: sorteado por frame, a borda ferve em vez de
         avançar, e o efeito lê como chuvisco de TV, não como revelação */
      ruido = Array.from({ length: cols * rows }, () => Math.random())
    }

    medir()

    /* progresso normalizado (0..1) de cada célula ao longo do eixo da varredura */
    const eixo = (cx: number, cy: number) => {
      switch (direction) {
        case "right":
          return 1 - cx / Math.max(1, cols - 1)
        case "up":
          return cy / Math.max(1, rows - 1)
        case "down":
          return 1 - cy / Math.max(1, rows - 1)
        default:
          return cx / Math.max(1, cols - 1)
      }
    }

    let raf = 0
    let t0 = 0
    let vivo = true

    const frame = (agora: number) => {
      if (!vivo) return
      if (!t0) t0 = agora
      const p = Math.min(1, (agora - t0) / duration)

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const limite = eixo(cx, cy) + ruido[cy * cols + cx] * roughness
          /* a frente avança até 1+roughness para garantir que a última coluna
             também some quando o ruído a empurra além de 1 */
          if (limite > p * (1 + roughness)) {
            ctx.fillRect(cx * cell, cy * cell, cell, cell)
          }
        }
      }

      if (p < 1) raf = requestAnimationFrame(frame)
      else canvas.style.display = "none"
    }

    /* só começa quando o bloco aparece: rodar fora da tela desperdiça o efeito */
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) {
          raf = requestAnimationFrame(frame)
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(host)

    /* pinta a cobertura cheia já no primeiro paint, senão o conteúdo aparece
       inteiro por um instante antes do dissolve começar */
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)

    const onResize = () => {
      if (canvas.style.display === "none") return
      medir()
    }
    window.addEventListener("resize", onResize)

    return () => {
      vivo = false
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [cell, duration, color, direction, roughness])

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />
}
