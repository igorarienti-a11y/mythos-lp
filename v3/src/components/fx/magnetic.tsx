"use client"

/**
 * Hover magnético: o wrapper persegue o cursor dentro de um raio e volta ao
 * lugar com mola ao sair.
 *
 * O transform mora no WRAPPER, nunca no `.btn` — o botão da Mythos já anima o
 * `::after` e a seta por transform, e empilhar os dois faz a cortina preta
 * escorregar junto com o botão.
 *
 * Só liga em ponteiro fino (mouse). No touch não existe hover: o efeito viraria
 * um pulo no primeiro toque, logo antes do clique.
 */

import { useEffect, useRef } from "react"

export type MagneticProps = {
  children: React.ReactNode
  /** quanto do deslocamento do cursor o elemento acompanha (0..1) */
  strength?: number
  /** raio de captura em px além da própria caixa */
  radius?: number
  className?: string
  block?: boolean
}

export function Magnetic({
  children,
  strength = 0.32,
  radius = 90,
  className,
  block = false,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const forcar = (window as { MYTHOS_FORCAR_ANIMACAO?: boolean })
      .MYTHOS_FORCAR_ANIMACAO
    const reduzido =
      !forcar && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ponteiroFino = window.matchMedia("(pointer: fine)").matches
    if (reduzido || !ponteiroFino) return

    let raf = 0
    let alvoX = 0
    let alvoY = 0
    let x = 0
    let y = 0

    const loop = () => {
      /* lerp: sem ele o elemento cola no cursor e o efeito perde o peso */
      x += (alvoX - x) * 0.18
      y += (alvoY - y) * 0.18
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      if (Math.abs(alvoX - x) > 0.1 || Math.abs(alvoY - y) > 0.1) {
        raf = requestAnimationFrame(loop)
      } else {
        raf = 0
      }
    }

    const acorda = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      /* captura numa elipse que acompanha a caixa: um raio circular puro deixa
         botão largo com zona morta nas pontas */
      const dentro =
        Math.abs(dx) < r.width / 2 + radius &&
        Math.abs(dy) < r.height / 2 + radius
      if (dentro) {
        alvoX = dx * strength
        alvoY = dy * strength
      } else {
        alvoX = 0
        alvoY = 0
      }
      acorda()
    }

    const onLeave = () => {
      alvoX = 0
      alvoY = 0
      acorda()
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
      el.style.transform = ""
    }
  }, [strength, radius])

  return (
    <span className={`mag${block ? " mag--block" : ""} ${className ?? ""}`} ref={ref}>
      {children}
    </span>
  )
}
