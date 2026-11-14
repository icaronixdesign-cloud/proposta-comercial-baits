import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Scroll suave sincronizado com o ScrollTrigger
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // âncoras internas com scroll suave
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      lenis?.scrollTo(target, { offset: -20 });
    });
  });
}

// Barra de progresso da página
const pageBar = document.querySelector<HTMLElement>("[data-page-progress]");
if (pageBar) {
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (st) => gsap.set(pageBar, { scaleX: st.progress }),
  });
}

document.fonts.ready.then(() => {
  if (!reduce) {
    // 2. Fade-in e fade-out tipográfico
    document.querySelectorAll<HTMLElement>("[data-fade]").forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.9,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
          }),
      });
      gsap.to(el, {
        opacity: 0.1,
        y: -40,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 25%", end: "top -10%", scrub: true },
      });
    });

    // Palavras que acendem (manifesto)
    document.querySelectorAll<HTMLElement>("[data-words]").forEach((el) => {
      const split = SplitText.create(el, { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
        }
      );
    });

    // Cartões entram em sequência
    gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card, i) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        delay: (i % 4) * 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 90%" },
      });
    });
  }

  // 3. Scroll horizontal fixado (só em telas >= 768 px e sem reduced motion)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    document.querySelectorAll<HTMLElement>("[data-horizontal]").forEach((section) => {
      const track = section.querySelector<HTMLElement>("[data-track]");
      if (!track) return;
      section.classList.add("is-pinned");
      const bar = section.querySelector<HTMLElement>("[data-progress]");
      const counter = section.querySelector<HTMLElement>("[data-counter]");
      const panels = track.children.length;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const move = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            if (bar) gsap.set(bar, { scaleX: st.progress });
            if (counter) {
              const n = Math.min(panels, Math.floor(st.progress * panels) + 1);
              counter.textContent = String(n).padStart(2, "0");
            }
          },
        },
      });

      track.querySelectorAll<HTMLElement>("[data-panel-title]").forEach((t) => {
        gsap.from(t, {
          opacity: 0,
          x: 120,
          ease: "none",
          scrollTrigger: { trigger: t, containerAnimation: move, start: "left 95%", end: "left 55%", scrub: true },
        });
      });

      track.querySelectorAll<HTMLElement>("[data-bar]").forEach((b) => {
        gsap.from(b, {
          scaleX: 0,
          transformOrigin: "left center",
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: b, containerAnimation: move, start: "left 90%", end: "left 60%", scrub: true },
        });
      });

      return () => section.classList.remove("is-pinned");
    });
  });

  ScrollTrigger.refresh();
});

// 4. Contadores de preço (o valor final já está no HTML)
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
counters.forEach((el) => {
  const end = Number(el.dataset.count);
  const state = { v: 0 };
  gsap.to(state, {
    v: end,
    duration: reduce ? 0 : 1.4,
    ease: "expo.out",
    scrollTrigger: { trigger: el, start: "top 80%", once: true },
    onUpdate: () => {
      el.textContent = fmt(state.v);
    },
  });
});

// Chave "à vista −5%"
const toggle = document.querySelector<HTMLInputElement>("[data-vista-toggle]");
toggle?.addEventListener("change", () => {
  counters.forEach((el) => {
    const target = Number(toggle.checked ? el.dataset.vista : el.dataset.count);
    const from = Number(el.textContent?.replace(/\D/g, "") || 0);
    const state = { v: from };
    gsap.to(state, {
      v: target,
      duration: reduce ? 0 : 0.8,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = fmt(state.v);
      },
    });
  });
});
