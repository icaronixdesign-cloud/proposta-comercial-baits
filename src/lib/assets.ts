import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * true se o arquivo existir em public/.
 * As imagens do case entram depois (ver public/img/LEIA-ME.txt); enquanto não
 * existirem, o componente mostra o painel de cor em vez de pedir um arquivo que dá 404.
 */
export const hasPublic = (file: string) => existsSync(join(process.cwd(), "public", file));
