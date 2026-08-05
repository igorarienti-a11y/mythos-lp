"use client"

/**
 * Orquestração GSAP portada da v2 sem mudança de coreografia.
 *
 * Roda inteira em `useEffect` com `gsap.context()`: no App Router o componente
 * pode remontar (Fast Refresh, navegação client-side) e sem o context cada
 * remontagem empilharia um ScrollTrigger novo em cima do anterior — o sintoma é
 * pin duplicado e scrub com velocidade dobrada.
 *
 * Tudo é selecionado por id/classe do DOM já renderizado pelo servidor. Nenhum
 * nó é criado aqui, exceto os do SplitText (que é dono exclusivo do #heroH1).
 */

import { useEffect } from "react"
import gsap from "gsap"
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

const GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@/\\<>*+="

/** mesmo scramble do componente React, em vanilla, para o H1 que o SplitText possui */
function scrambleEl(el: Element, texto: string, duracao = 620, porChar = 220) {
  const chars = Array.from(texto)
  const inicios = chars.map((c, i) =>
    /[\s.,;:!?—–\-()[\]{}'"·…]/.test(c)
      ? 0
      : (i / Math.max(1, chars.length - 1)) * duracao
  )
  const t0 = performance.now()
  const frame = (agora: number) => {
    const t = agora - t0
    let pendente = false
    el.textContent = chars
      .map((c, i) => {
        if (/[\s.,;:!?—–\-()[\]{}'"·…]/.test(c)) return c
        if (t < inicios[i] + porChar) {
          pendente = true
          return GLIFOS[(Math.random() * GLIFOS.length) | 0]
        }
        return c
      })
      .join("")
    if (pendente) requestAnimationFrame(frame)
    else el.textContent = texto
  }
  requestAnimationFrame(frame)
}

export function ScrollFx() {
  useEffect(() => {
    const forcar = window.MYTHOS_FORCAR_ANIMACAO
    const anima =
      forcar || !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!anima) {
      document.documentElement.classList.add("no-anim")
      document.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
        el.style.opacity = "1"
        el.style.transform = "none"
      })
      return
    }

    /* sempre abrir no topo: sem isso o navegador restaura a posição e o
       ScrollTrigger calcula os pins a partir do lugar errado */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin)

    let smoother: ScrollSmoother | null = null

    /* Escotilha de QA (`?qa=1`). O ScrollSmoother põe o conteúdo num wrapper
       `position:fixed` com transform, e nesse estado o screenshot do
       Playwright/Chrome headless pinta só o primeiro frame — tudo abaixo da
       dobra sai em branco, dando falso negativo. Com a flag o scroll volta a ser
       nativo e as capturas funcionam. */
    const QA_SEM_SMOOTHER = new URLSearchParams(location.search).get("qa") === "1"

    const ctx = gsap.context(() => {
      /* ScrollSmoother é do mesmo motor do ScrollTrigger, então pin e scrub
         ficam sincronizados por construção, e não briga com scroll-behavior. */
      if (!QA_SEM_SMOOTHER) {
        smoother = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 1.15,
          effects: true,
          smoothTouch: false, // no celular o scroll nativo é melhor
          normalizeScroll: true,
          ignoreMobileResize: true,
        })
        smoother.scrollTop(0)
      } else {
        window.scrollTo(0, 0)
      }

      /* ---------- barra de progresso ---------- */
      const prog = document.getElementById("prog")
      if (prog) {
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            prog.style.width = (self.progress * 100).toFixed(2) + "%"
          },
        })
      }

      /* ---------- header inverte sobre bloco roxo/escuro ----------
         detalhe barato que quase ninguém faz: o header assume a cor da seção
         em vez de ficar um retângulo branco flutuando sobre o roxo */
      const hdr = document.getElementById("hdr")
      document.querySelectorAll(".dark-zone").forEach((zone) => {
        ScrollTrigger.create({
          trigger: zone,
          start: "top 68px",
          end: "bottom 68px",
          onToggle: (self) => hdr?.classList.toggle("over-dark", self.isActive),
        })
      })

      /* ---------- reveal genérico (batch, não um trigger por elemento) ---------- */
      if (QA_SEM_SMOOTHER) {
        /* em QA o reveal nasce pronto. O batch acende o elemento quando ele
           entra na viewport e a tween leva 0,85s — o Playwright fotografa antes
           disso e a seção sai em branco, que lê como bug de layout sem ser. */
        gsap.set(".rv", { opacity: 1, y: 0 })
      } else {
        ScrollTrigger.batch(".rv", {
          start: "top 88%",
          onEnter: (els) => {
            gsap.to(els, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power3.out",
              stagger: 0.09,
              overwrite: true,
            })
          },
          once: true,
        })
      }

      /* ====== 1. HERO — linhas subindo por dentro da máscara + scramble ======
         mask:'lines' embrulha cada linha num container com overflow clip, então
         a linha nasce por baixo da própria caixa de texto. autoSplit re-divide
         sozinho quando a fonte carrega ou a largura muda. */
      if (document.getElementById("heroH1")) {
        SplitText.create("#heroH1", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "hl",
          onSplit: (self) =>
            gsap
              .timeline()
              /* 130 e não 110: a linha ganhou padding embaixo (ver .hl no CSS)
                 para o "g" não ser fatiado, e com 110 ela espiava por dentro
                 desse padding */
              .from(self.lines, {
                yPercent: 130,
                duration: 1,
                ease: "expo.out",
                stagger: 0.11,
              })
              // o bloco roxo só varre depois da última linha assentar
              .add(() => {
                document.documentElement.classList.add("mark-go")
              }, "-=0.15")
              /* o scramble entra depois da varredura: rodar junto vira ruído,
                 o bloco roxo já é movimento suficiente. Busca o nó na hora
                 porque o autoSplit pode tê-lo reparentado. */
              .add(() => {
                const marca = document.getElementById("heroMark")
                if (marca) scrambleEl(marca, "faturamento.")
              }, "+=0.42"),
        })
      }

      /* ====== 2. MARQUEE dirigido pela velocidade do scroll ======
         Não é `animation: linear infinite`. A faixa acelera com a rolagem e
         INVERTE quando você sobe a página — o olho registra que a página reage
         a você, mesmo sem saber por quê. */
      const track = document.getElementById("stripTrack")
      if (track) {
        const loop = gsap.to(track, {
          xPercent: -50,
          duration: 34,
          ease: "none",
          repeat: -1,
        })
        const ts = { v: 1 }
        let idle: ReturnType<typeof setTimeout>
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const alvo =
              self.direction *
              gsap.utils.clamp(1, 5.5, 1 + Math.abs(self.getVelocity()) / 620)
            gsap.to(ts, {
              v: alvo,
              duration: 0.35,
              overwrite: true,
              onUpdate: () => loop.timeScale(ts.v),
            })
            clearTimeout(idle)
            idle = setTimeout(() => {
              gsap.to(ts, {
                v: self.direction,
                duration: 1,
                overwrite: true,
                onUpdate: () => loop.timeScale(ts.v),
              })
            }, 180)
          },
        })
      }

      /* ====== 3. PROBLEMA — leitura forçada palavra a palavra ======
         A seção trava e o texto acende conforme você rola. Obriga a ler a dor
         inteira antes de liberar a página — é o momento de conversão da LP. */
      const txt = document.getElementById("probTxt")
      if (txt) {
        const split = SplitText.create(txt, { type: "words", wordsClass: "w" })
        if (QA_SEM_SMOOTHER) {
          // sem pin a captura fica estável; o estado final é o texto todo aceso
          gsap.set(split.words, { opacity: 1 })
        } else {
          gsap.set(split.words, { opacity: 0.13 })
          gsap.to(split.words, {
            opacity: 1,
            ease: "none",
            stagger: 0.4,
            scrollTrigger: {
              trigger: "#probStage",
              start: "top top",
              end: "+=130%",
              pin: true,
              scrub: 0.35,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
        }
      }

      /* ====== 4. SERVIÇOS — pin horizontal + inclinação por velocidade ====== */
      const viewport = document.getElementById("svcViewport")
      const svcTrack = document.getElementById("svcTrack")
      const bar = document.getElementById("svcBar")
      const count = document.getElementById("svcCount")
      if (svcTrack && viewport && bar && count && QA_SEM_SMOOTHER) {
        /* em QA o pin sai: ele reposiciona o palco durante o scroll da captura,
           e o Playwright acaba fotografando a caixa errada. A faixa fica no
           primeiro painel, que é o estado inicial real. */
        bar.style.width = "20%"
        count.textContent = "01 — 05"
      } else if (svcTrack && viewport && bar && count) {
        const painels = gsap.utils.toArray<HTMLElement>("#svcTrack .panel-in")
        const N = painels.length
        const distancia = () =>
          Math.max(0, svcTrack.scrollWidth - viewport.offsetWidth)

        gsap.to(svcTrack, {
          x: () => -distancia(),
          ease: "none", // obrigatório: outra ease quebra o mapa scroll↔posição
          scrollTrigger: {
            trigger: "#svcStage",
            start: "top top",
            end: () => "+=" + distancia(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress
              bar.style.width = (p * 100).toFixed(2) + "%"
              const i = Math.min(N, Math.floor(p * N) + 1)
              count.textContent = ("0" + i).slice(-2) + " — 0" + N
              // a inclinação segue a direção do movimento e volta ao zero sozinha
              const sk = gsap.utils.clamp(-7, 7, self.getVelocity() / -260)
              gsap.to(painels, {
                skewX: sk,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto",
              })
            },
            onLeave: () => gsap.to(painels, { skewX: 0, duration: 0.4 }),
            onLeaveBack: () => gsap.to(painels, { skewX: 0, duration: 0.4 }),
          },
        })
      }

      /* ====== 5. CASE — contador e barra scrubados ====== */
      const num = document.getElementById("caseNum")
      const barra = document.getElementById("caseBar")
      const fixa = document.querySelector<HTMLElement>(
        ".bar-row:not(.hi) .bar i"
      )
      const x = document.getElementById("caseX")
      if (num && barra) {
        if (fixa) {
          gsap.fromTo(
            fixa,
            { width: "0%" },
            {
              width: "5.49%",
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: "#case", start: "top 65%", once: true },
            }
          )
        }
        // parte do valor final que está no markup e recua para o inicial
        num.textContent = "5,49%"
        barra.style.width = "5.49%"
        const o = { v: 5.49 }
        gsap.to(o, {
          v: 51.36,
          ease: "none",
          scrollTrigger: {
            trigger: "#case",
            start: "top 62%",
            end: "bottom 85%",
            scrub: 0.4,
          },
          onUpdate: () => {
            num.textContent = o.v.toFixed(2).replace(".", ",") + "%"
            barra.style.width = o.v + "%"
          },
        })
        if (x) {
          gsap.from(x, {
            yPercent: 60,
            opacity: 0,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: x, start: "top 88%", once: true },
          })
        }
      }

      /* ====== 6. MÉTODO — linha que se desenha ligando as etapas ====== */
      const path = document.getElementById("metodoPath")
      if (path) {
        gsap.set(path, { drawSVG: "0%" })
        gsap.to(path, {
          drawSVG: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: "#steps",
            start: "top 78%",
            end: "bottom 72%",
            scrub: 0.5,
          },
        })
        gsap.utils.toArray<HTMLElement>("#steps .step").forEach((s) => {
          ScrollTrigger.create({
            trigger: s,
            start: "top 76%",
            onEnter: () => s.classList.add("on"),
          })
        })
      }

      /* ====== 7. CTA fixa do celular ======
         some enquanto os botões do hero ou o formulário estão à vista: repetir
         o CTA por cima deles só tampa a tela */
      const mcta = document.getElementById("mcta")
      const ctas = document.querySelector(".hero .ctas")
      if (mcta && ctas) {
        let noHero = true
        let noContato = false
        const aplica = () => mcta.classList.toggle("hide", noHero || noContato)
        ScrollTrigger.create({
          trigger: ctas,
          start: "top bottom",
          end: "bottom top",
          onToggle: (s) => {
            noHero = s.isActive
            aplica()
          },
        })
        ScrollTrigger.create({
          trigger: "#contato",
          start: "top 70%",
          end: "bottom top",
          onToggle: (s) => {
            noContato = s.isActive
            aplica()
          },
        })
        aplica()
      }
    })

    /* o next/font já elimina o swap de fonte, mas o refresh continua barato e
       cobre imagem tardia e mudança de altura do formulário */
    document.fonts.ready.then(() => ScrollTrigger.refresh())

    return () => {
      ctx.revert()
      smoother?.kill()
    }
  }, [])

  return null
}
