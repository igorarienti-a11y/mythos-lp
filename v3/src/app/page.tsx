import { CaseStudy } from "@/components/case-study"
import { Contato } from "@/components/contato"
import { Floating } from "@/components/floating"
import { Hero } from "@/components/hero"
import { ScrollFx } from "@/components/scroll-fx"
import {
  Fronteira,
  MarqueeStrip,
  Metodo,
  Problema,
  Servicos,
  SiteFooter,
} from "@/components/sections"
import { SiteHeader } from "@/components/site-header"

export default function Page() {
  return (
    <>
      {/* Fixos ficam FORA do #smooth-wrapper: dentro de um container com
          transform, position:fixed prende ao conteúdo, não à viewport. */}
      <SiteHeader />
      <Floating />
      <ScrollFx />

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Hero />
          <MarqueeStrip />
          <Problema />
          <Servicos />
          <CaseStudy />
          <Metodo />
          <Fronteira />
          <Contato />
          <SiteFooter />
        </div>
      </div>
    </>
  )
}
