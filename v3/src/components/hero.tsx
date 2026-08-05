import { CtaButton } from "@/components/fx/cta-button"
import { ScrambleText } from "@/components/fx/scramble-text"
import { GridBeam } from "@/components/ui/grid-beam"

/**
 * O H1 é markup estático de propósito — nada de React lá dentro.
 *
 * O SplitText embrulha cada linha num container próprio (mask:'lines') e, com
 * autoSplit, faz revert()+split de novo a cada mudança de largura. Esse revert
 * repõe o subárvore a partir de uma string de HTML: qualquer nó que o React
 * estivesse controlando ali vira nó órfão, e as atualizações seguintes do React
 * passam a escrever num elemento fora da página. Por isso o scramble da palavra
 * marcada roda no vanilla, junto do resto da orquestração GSAP.
 *
 * A faixa de fatos não é tocada pelo SplitText (só recebe opacity/y do batch
 * `.rv`), então ali o componente React é seguro.
 */
export function Hero() {
  return (
    <section className="hero" id="top">
      {/* fundo generativo do Cult UI — decorativo, atrás de tudo, sem clique */}
      <div className="hero-beam">
        <GridBeam
          aria-hidden="true"
          borderRadius={0}
          breathe
          colorVariant="ocean"
          cols={9}
          duration={7}
          rows={5}
          strength={0.34}
          style={{ width: "100%", height: "100%" }}
          theme="light"
        />
      </div>

      <div className="wrap">
        <span className="lbl rv">BR &nbsp;▸&nbsp; PY · Agência de performance</span>

        {/* o ponto vai DENTRO da marca: solto, ele quebra sozinho para a linha
            de baixo no celular e fica um pingo órfão embaixo do bloco roxo */}
        <h1 className="h-xl" id="heroH1">
          A gente não vende alcance.
          <br />
          Vende{" "}
          <span className="mark" id="heroMark">
            faturamento.
          </span>
        </h1>

        <div className="sub">
          <p className="lead rv">
            Tráfego, site, automação, conteúdo e dado numa estrutura só — operada
            por quem sobe campanha todo dia, dos dois lados da fronteira. Você não
            precisa de cinco fornecedores. Precisa de uma estrutura que fecha a
            conta.
          </p>
          <div className="ctas rv">
            <CtaButton href="#contato">Quero um diagnóstico</CtaButton>
            <CtaButton arrow={false} beam={false} className="ghost" href="#servicos">
              O que fazemos
            </CtaButton>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="facts">
          <div className="fact rv">
            <div className="v">
              <ScrambleText duration={520} playOnView text="5,49%" />{" "}
              <em>→</em>{" "}
              <ScrambleText delay={180} duration={620} playOnView text="51,36%" />
            </div>
            <div className="k">Qualificação de lead · cliente B2B de facilities</div>
          </div>
          <div className="fact rv">
            <div className="v">
              <ScrambleText duration={520} playOnView text="2 países" />
            </div>
            <div className="k">Operação ativa no Brasil e no Paraguai</div>
          </div>
          <div className="fact rv">
            <div className="v">
              <ScrambleText duration={520} playOnView text="11 marcas" />
            </div>
            <div className="k">Na carteira hoje · varejo, serviço e B2B</div>
          </div>
        </div>
      </div>
    </section>
  )
}
