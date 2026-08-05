"use client"

import { PixelReveal } from "@/components/fx/pixel-reveal"

/**
 * Os valores FINAIS ficam no markup e a animação parte deles para trás. Ao
 * contrário: se o scrub não rodasse, a linha "Depois" mostraria 5,49% — o número
 * errado, apresentado como se fosse o resultado.
 *
 * O pixel-reveal cobre só o bloco de barras, não a seção: sobre a coluna de
 * texto ele atrasaria a leitura da prova sem ganhar nada.
 */
export function CaseStudy() {
  return (
    <section className="pad" id="case">
      <div className="wrap">
        <span className="lbl rv">Prova</span>
        <h2 className="h-lg rv" style={{ margin: "var(--s-5) 0 0", maxWidth: "18ch" }}>
          O que acontece quando a estrutura entra.
        </h2>

        <div className="case-grid">
          <dl className="case-meta rv">
            <dt>Cliente</dt>
            <dd>
              Empresa de facilities e terceirização, B2B — nome preservado por
              acordo
            </dd>
            <dt>O problema</dt>
            <dd>
              A conta gerava lead em volume, mas a maioria era candidato a vaga de
              emprego. O comercial gastava o dia atendendo quem nunca ia comprar.
            </dd>
            <dt>O que foi feito</dt>
            <dd>
              Lista de negativas de modificadores de emprego, keywords B2B em frase
              e qualificação por estágio realimentando a campanha — a conta passou
              a aprender quem compra.
            </dd>
          </dl>

          <div className="bars rv px-host">
            <PixelReveal
              cell={13}
              className="px-canvas"
              color="#F2EEF5"
              direction="left"
              duration={1150}
            />
            <div className="bar-row">
              <div className="bl">
                <span className="bn">Antes</span>
                <span className="bv">5,49%</span>
              </div>
              <div className="bar">
                <i style={{ width: "5.49%" }} />
              </div>
            </div>
            <div className="bar-row hi">
              <div className="bl">
                <span className="bn">Depois</span>
                <span className="bv" id="caseNum">
                  51,36%
                </span>
              </div>
              <div className="bar">
                <i id="caseBar" style={{ width: "51.36%" }} />
              </div>
            </div>
            <div className="case-x" id="caseX">
              9x
            </div>
          </div>
        </div>

        <p className="case-note rv">
          Um case real, de uma conta real, com o número que o Google Ads mostra —
          não uma média de mercado nem projeção. Resultado passado não garante o
          seu: o seu depende da sua oferta, da sua margem e do seu comercial
          atender.
        </p>
      </div>
    </section>
  )
}
