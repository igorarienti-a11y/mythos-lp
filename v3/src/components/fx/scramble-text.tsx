"use client"

/**
 * Scramble/glitch reveal no espírito do `scrambletext` do OriginKit, reescrito
 * em React puro (o original é um fetch pago via MCP, e a lógica é curta).
 *
 * Decisões que importam:
 * - O texto final vai no DOM desde o primeiro paint e é só *sobrescrito* pelo
 *   efeito. Se o JS morrer, a manchete continua legível — mesma regra do
 *   `.mark` da v2, onde o default invertido apagou parte do H1 na v1.
 * - Espaço e pontuação nunca embaralham: só letra e dígito. Sem isso a caixa
 *   do texto muda de largura a cada frame e empurra o layout.
 * - Um rAF só para todos os caracteres, com relógio de tempo real. Timer por
 *   caractere multiplica o custo e desalinha em aba de fundo.
 */

import { useCallback, useEffect, useRef, useState } from "react"

const GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@/\\<>*+="
const NAO_EMBARALHA = /[\s.,;:!?—–\-()[\]{}'"·…]/

export type ScrambleTextProps = {
  text: string
  className?: string
  /** ms até o último caractere começar a assentar */
  duration?: number
  /** ms que cada caractere passa embaralhando antes de travar */
  charDuration?: number
  /** dispara sozinho quando entra na viewport */
  playOnView?: boolean
  /** dispara quando vira true — para encadear depois de outra animação */
  play?: boolean
  /** reembaralha no hover/focus */
  scrambleOnHover?: boolean
  /** atraso antes de começar, em ms */
  delay?: number
  as?: "span" | "div"
}

export function ScrambleText({
  text,
  className,
  duration = 900,
  charDuration = 260,
  playOnView = false,
  play,
  scrambleOnHover = false,
  delay = 0,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [saida, setSaida] = useState(text)
  const hostRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const jaRodou = useRef(false)

  /* respeita o mesmo interruptor global da v2: o Windows do Igor liga
     prefers-reduced-motion sozinho (MinAnimate=0) */
  const podeAnimar = useCallback(() => {
    if (typeof window === "undefined") return false
    if ((window as { MYTHOS_FORCAR_ANIMACAO?: boolean }).MYTHOS_FORCAR_ANIMACAO)
      return true
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const rodar = useCallback(() => {
    if (!podeAnimar()) {
      setSaida(text)
      return
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const chars = Array.from(text)
    /* o início de cada caractere se espalha por `duration`; o último a começar
       ainda tem `charDuration` para assentar, então o total é a soma dos dois */
    const inicios = chars.map((c, i) =>
      NAO_EMBARALHA.test(c) ? 0 : (i / Math.max(1, chars.length - 1)) * duration
    )
    const t0 = performance.now() + delay

    const frame = (agora: number) => {
      const t = agora - t0
      let pendente = false

      const proximo = chars
        .map((c, i) => {
          if (NAO_EMBARALHA.test(c)) return c
          const inicio = inicios[i]
          if (t < inicio) {
            pendente = true
            return GLIFOS[(Math.random() * GLIFOS.length) | 0]
          }
          if (t < inicio + charDuration) {
            pendente = true
            return GLIFOS[(Math.random() * GLIFOS.length) | 0]
          }
          return c
        })
        .join("")

      setSaida(proximo)
      if (pendente) rafRef.current = requestAnimationFrame(frame)
      else {
        setSaida(text)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(frame)
  }, [text, duration, charDuration, delay, podeAnimar])

  /* dispara por prop (encadeamento) */
  useEffect(() => {
    if (play && !jaRodou.current) {
      jaRodou.current = true
      rodar()
    }
  }, [play, rodar])

  /* dispara por viewport */
  useEffect(() => {
    if (!playOnView) return
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !jaRodou.current) {
          jaRodou.current = true
          rodar()
          io.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [playOnView, rodar])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  /* o texto real fica no DOM para leitor de tela e para SEO; o embaralhado é
     puramente visual e some da árvore de acessibilidade */
  return (
    <Tag
      ref={hostRef as never}
      className={className}
      onMouseEnter={scrambleOnHover ? rodar : undefined}
      onFocus={scrambleOnHover ? rodar : undefined}
    >
      <span aria-hidden="true">{saida}</span>
      <span className="sr-only">{text}</span>
    </Tag>
  )
}
