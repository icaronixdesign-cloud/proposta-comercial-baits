import { defineConfig } from "astro/config";

// Vercel define VERCEL=1 no build e publica na raiz do domínio.
// GitHub Pages publica em /proposta-comercial-baits/.
const onVercel = !!process.env.VERCEL;

export default defineConfig({
  site: onVercel
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || "proposta-comercial-baits.vercel.app"}`
    : "https://icaronixdesign-cloud.github.io",
  base: onVercel ? "/" : "/proposta-comercial-baits",
});
