# Próximos passos (estado em 15/11/2026)

## Onde paramos
- No ar na Vercel: https://proposta-comercial-baits.vercel.app/ (publica sozinho a cada push na `main`).
- `astro.config.mjs` usa base `/` quando `VERCEL` está definido e `/proposta-comercial-baits` no GitHub Pages.
- Feito: refino visual, animações (pins, fade, contadores), plano único Flow + Digital com à vista −5%, aceite e agenda via WhatsApp, contraste AA, reduced motion, teclado.
- O personagem Braian saiu do site (briefing: vender a proposta como se a marca ainda não existisse). A paleta e a retícula ficam.
- Hero com título "Proposta Comercial — BAITS" e ficha-resumo; Entregáveis e Aceite sem painéis vazios; seção final "Quem assina" com retrato e projetos do portfólio (`src/data/portfolio.json`).
- O workflow do GitHub Pages falha em `configure-pages` porque o Pages não está ativado (não afeta a Vercel).

## Pendências
1. Trocar `email` em `src/data/proposta.json` (hoje `seu-email@exemplo.com`).
2. Adicionar imagens em `public/img/` (nomes em `LEIA-ME.txt`), `public/proposta-baits.pdf` e `public/og-baits.png`.
   O site detecta os arquivos no build; o botão "Baixar PDF" só aparece quando o PDF existir.
3. Decidir o GitHub Pages: ativar (Settings → Pages → Source: GitHub Actions) ou remover `.github/workflows/deploy.yml`.

## Mensagem para colar num chat novo
> Continue o projeto em C:\Users\Icaronix\Documents\proposta-comercial-baits
> (repo icaronixdesign-cloud/proposta-comercial-baits, no ar em https://proposta-comercial-baits.vercel.app/).
> Leia PROXIMOS-PASSOS.md e README.md. Rode `npm install` e `npm run dev`
> (http://localhost:4321/proposta-comercial-baits/). Não mude valores, prazos ou textos de proposta.json
> sem me perguntar. Commit e push na main (a Vercel publica sozinha).
