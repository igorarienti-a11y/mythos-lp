import { MARCAS } from "@/lib/mythos"
import { CtaButton } from "@/components/fx/cta-button"

/* ==================== FAIXA DE PROVA (marquee) ====================
   Duas cópias da lista = loop de -50% sem emenda visível. A velocidade é
   dirigida pelo scroll na orquestração GSAP, não por `animation` do CSS. */
export function MarqueeStrip() {
  return (
    <div aria-label="Marcas atendidas" className="strip dark-zone" id="strip">
      <div className="track" id="stripTrack">
        {[...MARCAS, ...MARCAS].map((m, i) => (
          <span className="it2" key={`${m}-${i}`}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ==================== PROBLEMA (scrub palavra a palavra) ==================== */
export function Problema() {
  return (
    <section id="problema">
      <div className="prob-stage" id="probStage">
        <div className="wrap">
          <p className="prob-txt" id="probTxt">
            Você já pagou por relatório bonito. Já ouviu que o alcance cresceu. Já
            viu o post bombar. E no fim do mês a pergunta continuou a mesma:{" "}
            <span className="prob-punch">quanto disso virou venda?</span>
          </p>
        </div>
      </div>
      <div className="wrap" style={{ paddingBottom: "clamp(70px,10vh,120px)" }}>
        <div className="prob-foot">
          <span className="lbl">A Mythos existe pra responder isso com número</span>
          <p>Se a resposta não cabe numa planilha, não foi marketing — foi despesa.</p>
        </div>
      </div>
    </section>
  )
}

/* ==================== SERVIÇOS (pin horizontal) ==================== */
const SERVICOS = [
  {
    n: "01",
    h: "Tráfego pago",
    p: 'Meta e Google com estrutura de verdade: oferta, funil, criativo e otimização olhando ROAS e custo por venda. Não alcance, não impressão, não "engajamento".',
    tags: ["Meta Ads", "Google Ads", "Criativo", "ROAS", "Escala"],
  },
  {
    n: "02",
    h: "Sites & landing pages",
    p: "Página rápida, medida e feita para converter — com rastreamento server-side ligado no dia um, não três meses depois quando o dado já se perdeu.",
    tags: ["Landing pages", "Sites", "CAPI", "Performance", "UX"],
  },
  {
    n: "03",
    h: "Automação & CRM",
    p: "WhatsApp, nutrição e CRM rodando sozinhos. O lead é respondido em segundos, não no dia seguinte — quando ele já falou com o concorrente.",
    tags: ["WhatsApp", "CRM", "Nutrição", "Pós-venda"],
  },
  {
    n: "04",
    h: "Social & conteúdo",
    p: "Conteúdo que constrói autoridade e ainda alimenta a campanha. A mesma voz no orgânico e no pago, porque o cliente não separa os dois.",
    tags: ["Estratégia", "Criativos", "Calendário", "Comunidade"],
  },
  {
    n: "05",
    h: "Dados",
    p: "Dashboard ao vivo com ROAS, CAC e venda no momento em que acontecem. A próxima decisão sai do número — e quando o número é ruim, você ouve isso da gente.",
    tags: ["Dashboard ao vivo", "ROAS & CAC", "Relatório", "Alerta"],
  },
]

export function Servicos() {
  return (
    <section className="inv dark-zone" id="servicos">
      <div className="wrap svc-intro">
        <span className="lbl rv">O que fazemos</span>
        <h2
          className="h-lg rv"
          style={{ margin: "var(--s-5) 0", maxWidth: "16ch" }}
        >
          Cinco frentes. Uma estrutura só.
        </h2>
        <p className="lead rv">
          Cada peça alimenta a próxima: o tráfego abastece, a página converte, a
          automação responde, o conteúdo sustenta e o dado corrige a rota.
          Separadas, viram custo.
        </p>
      </div>

      <div className="svc-stage" id="svcStage">
        <div className="svc-viewport" id="svcViewport">
          <div className="svc-track" id="svcTrack">
            {SERVICOS.map((s, i) => (
              <article className="panel" key={s.n}>
                <div className="panel-in">
                  <span aria-hidden="true" className="idx">
                    {i + 1}
                  </span>
                  <div>
                    <span className="num">{s.n} / 05</span>
                    <h3>{s.h}</h3>
                    <p>{s.p}</p>
                  </div>
                  <ul>
                    {s.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="wrap">
          <div className="svc-foot">
            <span className="svc-count" id="svcCount">
              01 — 05
            </span>
            <span className="svc-bar">
              <i id="svcBar" />
            </span>
          </div>
        </div>
      </div>

      <div className="wrap svc-outro">
        <CtaButton href="#contato">Montar a minha estrutura</CtaButton>
      </div>
    </section>
  )
}

/* ==================== MÉTODO ==================== */
const ETAPAS = [
  {
    n: "01",
    h: "Diagnóstico",
    p: "Antes da verba, os números: oferta, margem, ciclo de venda e onde o dinheiro está vazando hoje. Se não fizer sentido, a gente fala.",
  },
  {
    n: "02",
    h: "Estrutura",
    p: "Página, rastreamento, automação e CRM no lugar. Campanha em cima de estrutura torta é dinheiro no lixo com relatório bonito.",
  },
  {
    n: "03",
    h: "Tráfego",
    p: "Sobe campanha, testa criativo, corta o que não paga. Toda semana, não todo trimestre.",
  },
  {
    n: "04",
    h: "Qualificação",
    p: "Seu comercial marca quem virou cliente, e isso volta para a campanha. É aqui que 5,49% vira 51,36%.",
  },
]

export function Metodo() {
  return (
    <section className="pad" id="metodo">
      <div className="wrap">
        <span className="lbl rv">Como funciona</span>
        <h2 className="h-lg rv" style={{ margin: "var(--s-5) 0", maxWidth: "15ch" }}>
          Quatro etapas que não param de girar.
        </h2>
        <p className="lead rv">
          Não é campanha, é ciclo. A quarta etapa alimenta a primeira, e por isso a
          conta fica melhor no mês seis do que estava no mês um.
        </p>

        <div className="steps" id="steps">
          <svg aria-hidden="true" id="metodoLine" preserveAspectRatio="none">
            <line
              id="metodoPath"
              stroke="#5C068C"
              strokeWidth="2"
              x1="0"
              x2="100%"
              y1="1"
              y2="1"
            />
          </svg>
          {ETAPAS.map((e) => (
            <div className="step rv" key={e.n}>
              <span className="sn">{e.n}</span>
              <h3>{e.h}</h3>
              <p>{e.p}</p>
            </div>
          ))}
        </div>

        <div className="loop rv">
          <svg viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v5h-5" />
          </svg>
          A etapa 04 realimenta a 01 · o ciclo não fecha, recomeça
        </div>
      </div>
    </section>
  )
}

/* ==================== BR + PY ==================== */
export function Fronteira() {
  return (
    <section className="pad" id="fronteira">
      <div className="wrap">
        <span className="lbl rv">Quem somos</span>
        <h2 className="h-lg rv" style={{ margin: "var(--s-5) 0 0", maxWidth: "17ch" }}>
          A extensão estratégica do seu marketing.
        </h2>

        <div className="paises">
          <div className="pais rv">
            <span className="fl">BRASIL</span>
            <h3>Português</h3>
            <p>
              Conta rodando, criativo produzido e comercial acompanhado no mesmo
              fuso e na mesma língua do seu cliente.
            </p>
          </div>
          <div className="pais rv">
            <span className="fl">PARAGUAI</span>
            <h3>Español</h3>
            <p>
              Operação real do outro lado da fronteira — CTWA, catálogo e
              marketplace com quem entende o mercado de lá, não com tradução
              automática.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ==================== FOOTER ==================== */
export function SiteFooter() {
  return (
    <footer className="site dark-zone">
      <div className="wrap">
        <div className="foot">
          <div>
            <span className="brand">MYTHOS</span>
            <p className="slogan">
              Estrutura que vende hoje. Marca que fica pra sempre.
            </p>
          </div>
          <div>
            <h4>Navegação</h4>
            <a href="#problema">Diagnóstico</a>
            <a href="#servicos">O que fazemos</a>
            <a href="#case">Case</a>
            <a href="#metodo">Método</a>
            <a href="#contato">Contato</a>
          </div>
          <div>
            <h4>Contato</h4>
            <a
              href="https://instagram.com/mythosagency_"
              rel="noopener"
              target="_blank"
            >
              @mythosagency_
            </a>
            <a href="mailto:mythosinmarketing@gmail.com">
              mythosinmarketing@gmail.com
            </a>
            <span className="fi">Brasil &amp; Paraguai</span>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Mythos · Agência de performance BR + PY</span>
          <span>Tráfego · Sites · Automação · Social · Dados</span>
        </div>
      </div>
    </footer>
  )
}
