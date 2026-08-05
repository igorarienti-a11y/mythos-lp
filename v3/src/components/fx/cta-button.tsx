"use client"

/**
 * CTA da Mythos = `.btn` da marca + border-beam (Cult UI / pacote `border-beam`)
 * + hover magnético.
 *
 * Por que o BorderBeam cru e não o `BorderBeamButton` do Cult UI: aquele
 * componente embrulha o `Button` do shadcn, que traz radius, paleta neutra e
 * escala próprias — tudo o que o `.btn` da Mythos define ao contrário (canto
 * vivo, roxo chapado, cortina preta subindo no hover). Reaproveitar o efeito e
 * descartar o invólucro mantém a marca intacta.
 *
 * `colorVariant="ocean"` é o único preset da lib na faixa azul/roxo, e com
 * `staticColors` ele para de derivar o matiz — sem isso o feixe passeia pelo
 * ciano e sai da paleta.
 */

import type { ReactNode } from "react"
import { BorderBeam } from "border-beam"

import { Magnetic } from "@/components/fx/magnetic"

export type CtaButtonProps = {
  children: ReactNode
  href?: string
  type?: "button" | "submit"
  /** seta que desliza no hover */
  arrow?: boolean
  /** ocupa a largura toda (formulário, CTA fixa do celular) */
  block?: boolean
  /** desliga o feixe: usar nos CTAs secundários para não competir */
  beam?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function CtaButton({
  children,
  href,
  type = "button",
  arrow = true,
  block = false,
  beam = true,
  className,
  onClick,
  disabled,
}: CtaButtonProps) {
  const conteudo = (
    <>
      <span className="t">{children}</span>
      {arrow ? (
        <span aria-hidden="true" className="arr">
          →
        </span>
      ) : null}
    </>
  )

  const alvo = href ? (
    <a className={`btn ${className ?? ""}`} href={href} onClick={onClick}>
      {conteudo}
    </a>
  ) : (
    <button
      className={`btn ${className ?? ""}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {conteudo}
    </button>
  )

  const envolvido = beam ? (
    <BorderBeam
      borderRadius={0}
      className={`beam-wrap${block ? " beam-wrap--block" : ""}`}
      colorVariant="ocean"
      duration={2.6}
      hueRange={12}
      size="sm"
      staticColors
      strength={0.85}
      theme="light"
    >
      {alvo}
    </BorderBeam>
  ) : (
    alvo
  )

  return (
    <Magnetic block={block} strength={beam ? 0.3 : 0.22}>
      {envolvido}
    </Magnetic>
  )
}
