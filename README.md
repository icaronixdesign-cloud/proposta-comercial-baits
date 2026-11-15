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
- No Sinal 10 (`Autor.astro`), `Personagem.astro` integra o avatar à esquerda dos projetos, sem painel ou controles extras. Ele entra caminhando da esquerda para a direita uma única vez, para e olha para o portfólio. O olhar acompanha suavemente o ponteiro e o foco nos projetos.
- No celular, o texto vem primeiro e o avatar fica ao lado das duas faixas de projetos, com deslize manual. Com movimento reduzido, o personagem já aparece parado na posição final, sem acompanhar o ponteiro. Fora da tela ou com a aba oculta, a renderização pausa.
- Os modelos ficam em `public/models/boneco/`: `boneco.glb` para desktop e `boneco-mobile.glb` para celular. O decoder Meshopt acompanha o bundle; não há dependência de CDN. Sem WebGL ou em caso de falha, aparece o retrato do autor.
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
