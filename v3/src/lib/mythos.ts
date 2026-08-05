/**
 * CONFIG · os IDs entram aqui, só aqui.
 *
 * Vem do bloco `window.MYTHOS` da v2. Continua sendo valor de build (NEXT_PUBLIC)
 * em vez de env de servidor de propósito: a LP é estática e o pixel/gtag rodam no
 * browser — esconder o ID num server component não esconderia nada, e quebraria
 * o export estático.
 */
export const MYTHOS = {
  ENDPOINT:
    process.env.NEXT_PUBLIC_MYTHOS_ENDPOINT ??
    "https://script.google.com/macros/s/AKfycbz1dw6SbA3yIACnejwS7JPcdMcgrUV70YtDUzbJlmfbzS6-XSEAHnlonwBe1Bunf-7TyA/exec",
  PIXEL_ID: process.env.NEXT_PUBLIC_MYTHOS_PIXEL_ID ?? "", // Events Manager → conjunto de dados da Mythos
  ADS_ID: process.env.NEXT_PUBLIC_MYTHOS_ADS_ID ?? "", // AW-0000000000
  ADS_LABEL: process.env.NEXT_PUBLIC_MYTHOS_ADS_LABEL ?? "", // rótulo da ação "Lead - Formulário"
  ADS_LABEL_WA: process.env.NEXT_PUBLIC_MYTHOS_ADS_LABEL_WA ?? "", // rótulo da ação "Clique WhatsApp" (opcional)
  GA4_ID: process.env.NEXT_PUBLIC_MYTHOS_GA4_ID ?? "", // G-XXXXXXXXXX
  WHATSAPP: process.env.NEXT_PUBLIC_MYTHOS_WHATSAPP ?? "", // só dígitos com DDI, ex 5548999999999

  /* separa os leads das duas LPs no teste A/B. O Apps Script monta a linha a
     partir dos cabeçalhos, então campo sem coluna é ignorado sem erro. */
  VARIANTE: "v3",

  /* Igor mantém a animação ligada mesmo com "reduzir movimento" do Windows
     (MinAnimate=0 liga o prefers-reduced-motion sem o usuário pedir).
     Trocar para false devolve o padrão do sistema. */
  FORCAR_ANIMACAO: true,
} as const

export const MARCAS = [
  "Amora Lingerie",
  "Via Center",
  "Parisis Estética",
  "Rita Pimentel",
  "Desenvolve Soluções",
  "Delt4",
  "Realizetur Viagens",
  "Dariano Planejados",
  "Autoescola Batistense",
  "Pizzaria do Rick",
  "Valtcompany",
] as const
