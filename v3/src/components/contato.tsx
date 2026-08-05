"use client"

import { useEffect, useRef, useState } from "react"

import { MYTHOS } from "@/lib/mythos"
import { basePayload, novoEventId, urlWhatsApp } from "@/lib/tracking"
import { CtaButton } from "@/components/fx/cta-button"

type Campo = "nome" | "email" | "telefone" | "faturamento"

const FAIXAS = [
  ["ate-10k", "Até R$ 10 mil / mês"],
  ["10k-50k", "R$ 10 mil a R$ 50 mil / mês"],
  ["50k-100k", "R$ 50 mil a R$ 100 mil / mês"],
  ["100k-500k", "R$ 100 mil a R$ 500 mil / mês"],
  ["500k-1m", "R$ 500 mil a R$ 1 milhão / mês"],
  ["acima-1m", "Acima de R$ 1 milhão / mês"],
  ["pre-faturamento", "Ainda não faturo / começando"],
] as const

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** máscara BR; começou com "+" = número estrangeiro (PY etc.) e passa cru */
function mascaraTel(bruto: string): string {
  if (bruto.trim().charAt(0) === "+") {
    return "+" + bruto.replace(/\D/g, "").slice(0, 15)
  }
  const v = bruto.replace(/\D/g, "").slice(0, 11)
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3")
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3")
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5}).*/, "($1) $2")
  if (v.length > 0) return v.replace(/(\d{0,2}).*/, "($1")
  return ""
}

export function Contato() {
  const [valores, setValores] = useState<Record<Campo, string>>({
    nome: "",
    email: "",
    telefone: "",
    faturamento: "",
  })
  const [erros, setErros] = useState<Partial<Record<Campo, boolean>>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [wa, setWa] = useState("")
  const formRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    setWa(urlWhatsApp())
  }, [])

  const set = (c: Campo, v: string) => {
    setValores((s) => ({ ...s, [c]: v }))
    if (erros[c]) setErros((e) => ({ ...e, [c]: false }))
  }

  function validar(): Partial<Record<Campo, boolean>> {
    const e: Partial<Record<Campo, boolean>> = {}
    if (!valores.nome.trim()) e.nome = true
    if (!isEmail(valores.email)) e.email = true
    if (valores.telefone.replace(/\D/g, "").length < 10) e.telefone = true
    if (!valores.faturamento) e.faturamento = true
    return e
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validar()
    setErros(e)
    if (Object.keys(e).length) {
      formRef.current
        ?.querySelector(".field.error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    const eventId = novoEventId()
    const partes = valores.nome.trim().split(/\s+/)
    /* empresa/cnpj saíram do formulário (4 campos convertem mais), mas seguem no
       payload em branco: a planilha monta a linha pelos cabeçalhos e as colunas
       continuam existindo — some a chave, some o alinhamento das colunas. */
    const payload = {
      ...basePayload(),
      event_id: eventId,
      nome: valores.nome.trim(),
      email: valores.email.trim().toLowerCase(),
      telefone: valores.telefone.trim(),
      empresa: "",
      cnpj: "",
      faturamento: valores.faturamento,
    }

    // Meta: pixel no browser + CAPI no Apps Script, mesmo event_id → deduplica
    if (MYTHOS.PIXEL_ID) window.fbq?.("track", "Lead", {}, { eventID: eventId })

    // Google: enhanced conversions com dado do state, nunca raspando o DOM
    if (MYTHOS.ADS_ID && MYTHOS.ADS_LABEL) {
      const d = payload.telefone.replace(/\D/g, "")
      // DDI do que a pessoa digitou, nunca do IP
      const jaTemDDI = payload.telefone.trim().charAt(0) === "+"
      window.gtag?.("set", "user_data", {
        email: payload.email,
        phone_number: "+" + (jaTemDDI ? d : "55" + d),
        address: { first_name: partes[0] || "", last_name: partes.slice(1).join(" ") },
      })
      window.gtag?.("event", "conversion", {
        send_to: MYTHOS.ADS_ID + "/" + MYTHOS.ADS_LABEL,
        transaction_id: eventId,
      })
    }

    setEnviando(true)
    // não deixa o visitante preso se o endpoint pendurar
    const teto = setTimeout(() => setEnviado(true), 4000)

    // text/plain evita preflight (o Apps Script não responde OPTIONS)
    try {
      const r = await fetch(MYTHOS.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!j.ok) console.warn("lead recusado pelo endpoint", j)
    } catch {
      // plano B: no-cors não deixa ler a resposta, mas o POST chega
      try {
        await fetch(MYTHOS.ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        })
      } catch {}
    } finally {
      clearTimeout(teto)
      setEnviado(true)
    }
  }

  const campo = (
    id: Campo,
    label: string,
    erro: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    full = false
  ) => (
    <div className={`field${full ? " full" : ""}${erros[id] ? " error" : ""}`}>
      <label htmlFor={id}>
        {label} <span className="req">*</span>
      </label>
      <input
        aria-describedby={`err-${id}`}
        aria-invalid={erros[id] ? "true" : "false"}
        id={id}
        name={id}
        onChange={(e) =>
          set(id, id === "telefone" ? mascaraTel(e.target.value) : e.target.value)
        }
        value={valores[id]}
        {...props}
      />
      <span className="err-msg" id={`err-${id}`}>
        {erro}
      </span>
    </div>
  )

  return (
    <section className="pad inv dark-zone" id="contato">
      <div className="wrap">
        <span className="lbl rv">Fale conosco</span>
        <div className="ct-grid">
          <div className="rv">
            <h2
              className="h-md"
              style={{ margin: "var(--s-5) 0 var(--s-4)", maxWidth: "14ch" }}
            >
              Vamos olhar os seus números?
            </h2>
            <p className="lead">
              Preencha ao lado. A gente devolve um diagnóstico inicial da sua
              estrutura digital — de graça, e sem enrolação se o problema não for
              tráfego.
            </p>
            <div className="cinfo">
              {wa ? (
                <a href={wa} rel="noopener" target="_blank">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z" />
                    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
                  </svg>
                  Chamar no WhatsApp
                </a>
              ) : null}
              <a
                href="https://instagram.com/mythosagency_"
                rel="noopener"
                target="_blank"
              >
                <svg viewBox="0 0 24 24">
                  <rect height="18" width="18" x="3" y="3" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.4" cy="6.6" r="1.1" />
                </svg>
                @mythosagency_
              </a>
              <span className="ci">
                <svg viewBox="0 0 24 24">
                  <path d="M4 5h16v14H4z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                mythosinmarketing@gmail.com
              </span>
            </div>
          </div>

          <div className="form-card rv">
            {enviado ? null : (
              <form noValidate onSubmit={onSubmit} ref={formRef}>
                {campo("nome", "Nome", "Informe seu nome.", {
                  type: "text",
                  placeholder: "Seu nome completo",
                  autoComplete: "name",
                })}
                {campo("email", "E-mail", "Informe um e-mail válido.", {
                  type: "email",
                  placeholder: "voce@empresa.com",
                  autoComplete: "email",
                })}
                {campo("telefone", "WhatsApp", "Informe um telefone válido.", {
                  type: "tel",
                  placeholder: "(00) 00000-0000 — fora do BR, use +",
                  autoComplete: "tel",
                })}

                <div
                  className={`field full${erros.faturamento ? " error" : ""}`}
                >
                  <label htmlFor="faturamento">
                    Faturamento mensal <span className="req">*</span>
                  </label>
                  <select
                    aria-describedby="err-faturamento"
                    aria-invalid={erros.faturamento ? "true" : "false"}
                    id="faturamento"
                    name="faturamento"
                    onChange={(e) => set("faturamento", e.target.value)}
                    value={valores.faturamento}
                  >
                    <option disabled value="">
                      Selecione a faixa
                    </option>
                    {FAIXAS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <span className="err-msg" id="err-faturamento">
                    Selecione uma faixa de faturamento.
                  </span>
                </div>

                <CtaButton block disabled={enviando} type="submit">
                  Quero o diagnóstico
                </CtaButton>

                {/* prova no ponto de maior hesitação: o botão. A pesquisa é clara
                    em distribuir os sinais de confiança em vez de empilhar num
                    bloco só. */}
                <ul className="reassure">
                  <li>4 campos, sem ligação de vendas</li>
                  <li>Resposta em até 1 dia útil</li>
                  <li>Se o problema não for tráfego, a gente diz</li>
                </ul>
                <p className="form-note">
                  Ao enviar, você autoriza a Mythos a usar seus dados para entrar
                  em contato sobre este diagnóstico (LGPD, art. 7º). Não vendemos
                  nem repassamos sua informação, e você pode pedir a exclusão a
                  qualquer momento por e-mail.
                </p>
              </form>
            )}
            <div className={`success${enviado ? " show" : ""}`} id="success">
              <div className="ck">
                <svg viewBox="0 0 24 24">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
              <h3>Recebido.</h3>
              <p>
                O time da Mythos entra em contato. Já pode separar os números — a
                conversa começa por eles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
