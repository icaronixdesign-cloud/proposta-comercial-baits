import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Momento (s) em que a cortina do preloader abre — casa com a animação CSS em global.css */
const PRELOADER_OUT = 1.25;

const $ = (sel: string, ctx: ParentNode = document) => ctx.querySelector<HTMLElement>(sel);
const $$ = (sel: string, ctx: ParentNode = document) => Array.from(ctx.querySelectorAll<HTMLElement>(sel));

/* ------------------------------------------------------------------ */
/* 1. Scroll suave (Lenis) sincronizado com o ScrollTrigger            */
/* ------------------------------------------------------------------ */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Overlays (agenda) travam a rolagem suave enquanto estão abertos
window.addEventListener("baits:scroll-lock", () => lenis?.stop());
window.addEventListener("baits:scroll-unlock", () => lenis?.start());

// Âncoras internas: rolagem suave e foco no destino (teclado e leitor de tela)
const scrollAnchor = (el: HTMLElement) =>
  el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
const focusTarget = (el: HTMLElement) => {
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
};
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  const hash = a?.getAttribute("href");
  if (!a || !hash || hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;
  e.preventDefault();
  history.pushState(null, "", hash);
  if (lenis) {
    lenis.scrollTo(scrollAnchor(target), {
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      onComplete: () => focusTarget(target),
    });
  } else {
    scrollAnchor(target).scrollIntoView();
    focusTarget(target);
  }
});

/* ------------------------------------------------------------------ */
/* 2. Entrada do hero, sincronizada com a saída do preloader            */
/* ------------------------------------------------------------------ */
if (!reduce) {
  const visual = $("[data-hero-visual]");
  const foot = $("[data-hero-in]");
  const tl = gsap.timeline({ delay: PRELOADER_OUT });
  if (visual) {
    // Ficha-resumo: sobe inclinada e assenta; as linhas entram em seguida
    tl.from(visual, { y: 80, rotate: 3, opacity: 0, duration: 1.4, ease: "expo.out", clearProps: "transform" }, 0.1);
    tl.from(visual.children, { y: 16, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.35);
  }
  if (foot) tl.from(foot.children, { y: 28, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.45);
}

/* ------------------------------------------------------------------ */
/* 3. Link da seção atual na navegação                                  */
/* ------------------------------------------------------------------ */
const navMap = new Map<Element, HTMLElement>();
$$("[data-nav-link]").forEach((link) => {
  const sec = document.getElementById(link.getAttribute("href")!.slice(1));
  if (sec) navMap.set(sec, link);
});
const navIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      const link = navMap.get(en.target);
      if (!link) return;
      if (en.isIntersecting) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }),
  { rootMargin: "-50% 0px -50% 0px" }
);
navMap.forEach((_, sec) => navIO.observe(sec));

/* ------------------------------------------------------------------ */
/* 4. Trilhos horizontais (Método, Entregáveis, Cronograma)             */
/*    ≥ 768 px e sem reduced motion: seção fixada, trilho anda no scroll */
/*    Demais casos: carrossel nativo com barra e contador sincronizados  */
/* ------------------------------------------------------------------ */
const railUI = new WeakMap<HTMLElement, { bar: HTMLElement | null; counter: HTMLElement | null; total: number }>();
const updateRailUI = (section: HTMLElement, progress: number) => {
  let ui = railUI.get(section);
  if (!ui) {
    ui = {
      bar: $("[data-progress]", section),
      counter: $("[data-counter]", section),
      total: $("[data-track]", section)?.children.length ?? 1,
    };
    railUI.set(section, ui);
  }
  if (ui.bar) gsap.set(ui.bar, { scaleX: progress });
  if (ui.counter) {
    const n = String(Math.min(ui.total, Math.round(progress * (ui.total - 1)) + 1)).padStart(2, "0");
    if (ui.counter.textContent !== n) ui.counter.textContent = n;
  }
};

function initRails() {
  const sections = $$("[data-horizontal]");
  const mm = gsap.matchMedia();

  mm.add(
    {
      pin: "(min-width: 768px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)",
      native: "(max-width: 767px), (max-height: 559px), (prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { pin } = ctx.conditions as { pin: boolean };
      const cleanups: Array<() => void> = [];

      sections.forEach((section) => {
        const track = $("[data-track]", section);
        if (!track) return;
        const viewport = track.parentElement!;

        if (!pin) {
          const onScroll = () => {
            const max = track.scrollWidth - track.clientWidth;
            updateRailUI(section, max > 0 ? track.scrollLeft / max : 0);
          };
          track.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
          cleanups.push(() => track.removeEventListener("scroll", onScroll));
          return;
        }

        // A classe muda o layout (seção = 100vh); precisa vir antes de qualquer medida
        section.classList.add("is-pinned");
        track.removeAttribute("tabindex");
        cleanups.push(() => {
          section.classList.remove("is-pinned", "is-stuck");
          track.setAttribute("tabindex", "0");
        });

        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const move = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            toggleClass: "is-stuck",
            onUpdate: (st) => updateRailUI(section, st.progress),
          },
        });

        // Títulos dos painéis e barras do Gantt: os que já estão na tela entram com a seção;
        // os que estão fora entram quando o trilho os traz (containerAnimation).
        const vp = viewport.getBoundingClientRect();
        $$("[data-panel-title], [data-bar]", track).forEach((item) => {
          const isBar = item.hasAttribute("data-bar");
          const onScreen = item.getBoundingClientRect().left < vp.right - vp.width * 0.06;
          const st: ScrollTrigger.Vars = onScreen
            ? { trigger: section, start: "top 55%", toggleActions: "play none none reverse" }
            : { trigger: item, containerAnimation: move, start: "left 94%", toggleActions: "play none none reverse" };
          if (isBar) {
            gsap.fromTo(
              item,
              { clipPath: "inset(0% 100% 0% 0% round 999px)" },
              { clipPath: "inset(0% 0% 0% 0% round 999px)", duration: 1, ease: "expo.out", scrollTrigger: st }
            );
          } else {
            gsap.from(item, { x: 90, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: st });
          }
        });
      });

      // Quando os pins são recriados (resize), reordena para recalcular de cima para baixo
      ScrollTrigger.sort();
      return () => cleanups.forEach((fn) => fn());
    }
  );
}

/* ------------------------------------------------------------------ */
/* 5. Tipografia: fade de entrada/saída, palavras que acendem, cartões  */
/* ------------------------------------------------------------------ */
function initTypography() {
  if (reduce) return;

  $$("[data-fade]").forEach((el) => {
    const inHero = !!el.closest(".hero");
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          opacity: 0,
          filter: "blur(8px)",
          duration: 1.15,
          stagger: 0.08,
          ease: "expo.out",
          ...(inHero
            ? { delay: PRELOADER_OUT }
            : { scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" } }),
        }),
    });

    // Saída: só quando o bloco já está deixando a tela pelo topo.
    // Em seção fixada ou coluna sticky o título fica parado na tela, então não sai.
    // data-fade-stay: títulos do fim da página, que precisam continuar visíveis (Sinal 09).
    if (el.closest("[data-horizontal], [data-sticky]") || el.hasAttribute("data-fade-stay")) return;
    gsap.to(el, {
      opacity: 0,
      y: -32,
      filter: "blur(4px)",
      ease: "none",
      // clamp(): no hero o bloco já nasce acima de "bottom 30%"; sem isso ele abriria a página apagado
      scrollTrigger: { trigger: el, start: "clamp(bottom 30%)", end: "clamp(bottom 2%)", scrub: true },
    });
  });

  // Palavras que acendem (manifesto)
  $$("[data-words]").forEach((el) => {
    const split = SplitText.create(el, { type: "words" });
    gsap.fromTo(
      split.words,
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
      }
    );
  });

  // Cartões entram em sequência, grupo a grupo
  const groups = new Map<Element, HTMLElement[]>();
  $$("[data-card]").forEach((card) => {
    const parent = card.parentElement!;
    groups.set(parent, [...(groups.get(parent) ?? []), card]);
  });
  groups.forEach((cards, parent) => {
    gsap.from(cards, {
      y: 64,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.09,
      scrollTrigger: { trigger: parent, start: "top 82%" },
    });
  });
}

/* ------------------------------------------------------------------ */
/* 6. Preço: contador na entrada                                        */
/* ------------------------------------------------------------------ */
function initPrices() {
  if (reduce) return;
  const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
  $$("[data-count]").forEach((el) => {
    const state = { v: 0 };
    const full = Number(el.dataset.count);
    const render = () => (el.textContent = fmt(state.v));
    render();
    // end "max": nunca fica "depois do fim", então dispara mesmo se a página abrir no meio
    ScrollTrigger.create({
      trigger: el,
      start: "top 94%",
      end: "max",
      once: true,
      onEnter: () => gsap.to(state, { v: full, duration: 1.8, ease: "expo.out", onUpdate: render, onComplete: render }),
    });
  });
}

/* ------------------------------------------------------------------ */
/* 7. Barra de progresso da página                                      */
/* ------------------------------------------------------------------ */
function initPageProgress() {
  const bar = $("[data-page-progress]");
  if (!bar) return;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (st) => gsap.set(bar, { scaleX: st.progress }),
  });
}

/* ------------------------------------------------------------------ */
/* Ordem importa: pins primeiro (criam o espaço), depois o que vem       */
/* abaixo deles, por último o que depende da altura total da página.     */
/* ------------------------------------------------------------------ */
let started = false;
const initialHash = location.hash;
const alignInitialAnchor = () => {
  if (initialHash.length < 2 || location.hash !== initialHash) return;
  // Let the pin refresh and the browser's initial scroll restoration finish first.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    let id = initialHash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* Keep literal malformed hashes harmless. */ }
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(window.scrollY + scrollAnchor(target).getBoundingClientRect().top, { immediate: true, force: true });
    } else scrollAnchor(target).scrollIntoView();
  }));
};
const start = () => {
  if (started) return;
  started = true;
  initRails();
  initTypography();
  initPrices();
  initPageProgress();
  ScrollTrigger.refresh();
  if (document.readyState === "complete") alignInitialAnchor();
};
document.fonts.ready.then(start);
// Rede lenta: não segura a página esperando as fontes
setTimeout(start, 2500);
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  if (started) alignInitialAnchor();
});
