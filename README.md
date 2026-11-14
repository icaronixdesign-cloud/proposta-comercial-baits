# Proposta comercial — Baits

Site da proposta comercial Double Diamond para a **Baits**, a primeira marca de nutrição cognitiva.
Projeto de workshop por **Luiz Felipe Kallas** (UX/UI Design · Web Design · Experiência do Cliente).

**No ar:** https://icaronixdesign-cloud.github.io/proposta-comercial-baits/

## Stack
- [Astro](https://astro.build) — HTML estático, um componente por seção
- [GSAP](https://gsap.com) (ScrollTrigger + SplitText) — fade tipográfico, scroll horizontal, contadores
- [Lenis](https://github.com/darkroomengineering/lenis) — scroll suave
- GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) — publica a cada push na `main`

## Rodar localmente
```bash
npm install
npm run dev      # http://localhost:4321/proposta-comercial-baits/
npm run build    # gera dist/
```

## Onde editar
| O quê | Arquivo |
| --- | --- |
| Textos, valores, prazos, e-mail de contato | `src/data/proposta.json` |
| Cores, fontes, escala tipográfica | `src/styles/global.css` |
| Animações | `src/scripts/motion.ts` |
| Seções | `src/components/*.astro` |
| Imagens do case | `public/img/` (ver `LEIA-ME.txt`) |

As imagens, o PDF e a imagem de compartilhamento são detectados no build (`src/lib/assets.ts`):
sem o arquivo, a seção mostra o painel de cor com retícula e o botão "Baixar PDF" não aparece.
Basta soltar o arquivo com o nome certo e publicar de novo.

## Movimento e acessibilidade
- Trilhos de Método, Entregáveis e Cronograma ficam fixados só com tela ≥ 768 × 560 px e sem `prefers-reduced-motion`;
  nos demais casos viram carrossel nativo, focável e rolável pelas setas do teclado.
- Com `prefers-reduced-motion: reduce`: sem Lenis, sem preloader, sem pin, sem blur; preços aparecem no valor final.
- Âncoras internas movem o foco para a seção de destino; a chave "à vista" anuncia a troca de valores para leitores de tela.

## Antes do v1.0.0
- [ ] Trocar `email` em `src/data/proposta.json` pelo seu e-mail de contato
- [ ] Adicionar as imagens em `public/img/`, o PDF `public/proposta-baits.pdf` e a imagem `public/og-baits.png`
- [ ] Confirmar hex e fontes com os arquivos da marca e trocar o wordmark em texto pelo SVG original
- [ ] Autorização do Estudio Kimura para uso público da identidade

## Créditos
Identidade Baits © Estudio Kimura — projeto fictício do IA LAB 6 ([Behance](https://www.behance.net/gallery/234977239/Baits)).
