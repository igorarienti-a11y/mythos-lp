import type { Metadata, Viewport } from "next"
import { Azeret_Mono, DM_Serif_Display, Montserrat } from "next/font/google"

import { MYTHOS } from "@/lib/mythos"
import { Tracking } from "@/components/tracking"

import "./globals.css"

/* self-hosted pelo next/font: some o preconnect ao Google e o salto de layout na
   troca de fonte — que na v2 obrigava um ScrollTrigger.refresh() no
   document.fonts.ready para os pins não ficarem com offset errado */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
})
const azeret = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-azeret",
  display: "swap",
})
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-dmserif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Mythos · A gente não vende alcance. Vende faturamento.",
  description:
    "Agência de performance BR + PY. Tráfego, site, automação, conteúdo e dado numa estrutura só — operada por quem sobe campanha todo dia.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Mythos",
    locale: "pt_BR",
    title: "Mythos · A gente não vende alcance. Vende faturamento.",
    description:
      "Tráfego, site, automação, conteúdo e dado numa estrutura só. Agência de performance BR + PY.",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%235C068C'/%3E%3Cpath d='M13 47V17h7.5l11.5 17 11.5-17H51v30h-7.5V30L32 46 20.5 30v17z' fill='%23fff'/%3E%3C/svg%3E",
  },
}

export const viewport: Viewport = {
  themeColor: "#5C068C",
}

/* Interruptor de movimento + "armar" do bloco roxo do H1.
   Precisa rodar ANTES do primeiro paint: a classe `arm` deixa o bloco recolhido,
   e sem ela o bloco aparece pintado e depois recolhe (flash de estado final).
   O default do CSS é o bloco JÁ pintado de propósito — se este script não rodar,
   a palavra continua legível. */
const ARMAR = `
window.MYTHOS_FORCAR_ANIMACAO = ${MYTHOS.FORCAR_ANIMACAO};
(function(){
  var quer = window.MYTHOS_FORCAR_ANIMACAO ||
             !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!quer) return;
  document.documentElement.classList.add('arm');
  setTimeout(function(){ document.documentElement.classList.add('mark-go'); }, 2500);
})();
`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script ARMAR acrescenta `arm`/`mark-go` ao
    // <html> antes da hidratação (é o ponto dele), então o className do cliente
    // nunca bate com o do servidor. Mesmo caso dos scripts de tema.
    <html
      className={`${montserrat.variable} ${azeret.variable} ${dmSerif.variable}`}
      lang="pt-BR"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ARMAR }} />
      </head>
      <body>
        <Tracking />
        {children}
      </body>
    </html>
  )
}
