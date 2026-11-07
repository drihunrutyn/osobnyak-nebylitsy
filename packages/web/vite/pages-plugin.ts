import type { Plugin } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";

/** Adapt public URLs without changing template-managed plugins. */
export default function pagesPlugin(base: string): Plugin[] {
  let output = "";
  return [{
    name: "public-github-pages",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replace(/\\/g, "/");
      if (file.endsWith("/src/web/pages/content.ts")) {
        return code.replace(/(["'])\/images\//g, `$1${base}images/`);
      }
      if (file.endsWith("/src/web/pages/landing.tsx")) {
        return code.replace('href="/admin"', 'href="https://osobnyak-nebylitsy.onrender.com/admin"');
      }
    },
    configResolved(config) {
      output = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace('src="/src/web/main.tsx"', 'src="/src/web/pages-main.tsx"');
      },
    },
    async closeBundle() {
      await fs.writeFile(path.join(output, ".nojekyll"), "");
      // Preserve old /admin bookmarks, but never serve an admin application here.
      await fs.mkdir(path.join(output, "admin"), { recursive: true });
      await fs.writeFile(path.join(output, "admin/index.html"), '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://osobnyak-nebylitsy.onrender.com/admin"><title>Кабинет организатора</title></head><body><a href="https://osobnyak-nebylitsy.onrender.com/admin">Перейти в кабинет на Render</a></body></html>');
    },
  }, {
    name: "public-github-pages-html",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html
          .replace('src="/runable.js"', `src="${base}runable.js"`)
          .replace(`content="${base}images/poster.jpg"`, 'content="https://drihunrutyn.github.io/osobnyak-nebylitsy/images/poster.jpg"');
      },
    },
  }];
}