# Próximos passos (estado em 14/11/2026)

## Onde paramos
- Último trabalho: commit 742c833 na `main` (refino visual, animações, contraste AA, reduced motion, teclado).
- `npm run build` passa local e no GitHub Actions.
- **Deploy ainda falha** em `actions/configure-pages`: o GitHub Pages não está habilitado no repositório.

## Pendências
1. Settings → Pages → Build and deployment → **Source: GitHub Actions**; depois Actions → última execução → **Re-run all jobs**.
2. Trocar `email` em `src/data/proposta.json` (hoje `seu-email@exemplo.com`).
3. Adicionar imagens em `public/img/` (nomes em `LEIA-ME.txt`), `public/proposta-baits.pdf` e `public/og-baits.png`.
   O site detecta os arquivos no build; o botão "Baixar PDF" só aparece quando o PDF existir.

## Mensagem para colar num chat novo
> Continue o projeto em C:\Users\Icaronix\Documents\proposta-comercial-baits
> (repo icaronixdesign-cloud/proposta-comercial-baits). Leia PROXIMOS-PASSOS.md e README.md.
> Rode `npm install` e `npm run dev` (http://localhost:4321/proposta-comercial-baits/).
> Não mude valores, prazos ou textos de proposta.json sem me perguntar. Commit e push na main.
