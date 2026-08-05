"use client"

import { useEffect, useState } from "react"

const LINKS = [
  { href: "#problema", label: "Diagnóstico" },
  { href: "#servicos", label: "O que fazemos" },
  { href: "#case", label: "Case" },
  { href: "#metodo", label: "Método" },
]

export function SiteHeader() {
  const [aberto, setAberto] = useState(false)

  /* trava o scroll do body enquanto o menu está aberto e devolve no Esc */
  useEffect(() => {
    document.body.classList.toggle("no-scroll", aberto)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.classList.remove("no-scroll")
    }
  }, [aberto])

  return (
    <header className="site" id="hdr">
      <nav className="nav">
        <a className="brand" href="#top">
          MYTHOS
        </a>
        <div className={`nav-links${aberto ? " open" : ""}`} id="navlinks">
          {LINKS.map((l) => (
            <a href={l.href} key={l.href} onClick={() => setAberto(false)}>
              {l.label}
            </a>
          ))}
          <a
            className="btn"
            href="#contato"
            onClick={() => setAberto(false)}
          >
            <span className="t">Falar com a Mythos</span>
          </a>
        </div>
        <button
          aria-controls="navlinks"
          aria-expanded={aberto}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className={`burger${aberto ? " x" : ""}`}
          onClick={() => setAberto((v) => !v)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      <i className="progress" id="prog" />
    </header>
  )
}
