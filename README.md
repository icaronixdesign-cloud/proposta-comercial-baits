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
- O Sinal 10 preserva a foto original no arco amarelo. `Personagem.astro` fica na borda superior do rodapé, abaixo da coluna da foto, com 124 px de altura no desktop e 96 px no celular. O boneco caminha uma vez da esquerda para a direita e entra em repouso, sem controles ou seção extra.
- O personagem é decorativo e não interfere na rolagem ou nos links. Com movimento reduzido, já aparece parado; fora da tela ou com a aba oculta, a renderização pausa. Se WebGL ou o carregamento falhar, o detalhe 3D é omitido e a foto permanece.
- O modelo usado é `public/models/boneco/boneco-mobile.glb`, suficiente para essa escala em todas as telas. O decoder Meshopt acompanha o bundle, sem dependência de CDN.
- Trilhos de Método, Entregáveis e Cronograma ficam fixados só com tela ≥ 768 × 560 px e sem `prefers-reduced-motion`;
  nos demais casos viram carrossel nativo, focável e rolável pelas setas do teclado.
- Com `prefers-reduced-motion: reduce`: sem Lenis, sem preloader, sem pin, sem blur; preços aparecem no valor final.
- Âncoras internas movem o foco para a seção de destino.
- "Aceitar proposta" e a agenda de "Agendar conversa" abrem o WhatsApp (`whatsapp` em `proposta.json`).
  A agenda vai de amanhã até a sexta da última semana do projeto (kickoff na segunda seguinte + `plano.semanas`).

## Antes do v1.0.0
- [ ] Trocar `email` em `src/data/proposta.json` pelo seu e-mail de contato
- [ ] Adicionar as imagens em `public/img/`, o PDF `public/proposta-baits.pdf` e a imagem `public/og-baits.png`
- [ ] Confirmar hex e fontes com os arquivos da marca e trocar o wordmark em texto pelo SVG original
- [ ] Autorização do Estudio Kimura para uso público da identidade

## Créditos
Identidade Baits © Estudio Kimura — projeto fictício do IA LAB 6 ([Behance](https://www.behance.net/gallery/234977239/Baits)).
