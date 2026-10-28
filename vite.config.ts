import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { ResumePage } from "./src/resume/ResumePage";

function prerenderResume(): Plugin {
  return {
    name: "prerender-resume",
    transformIndexHtml(html) {
      const markup = renderToStaticMarkup(createElement(ResumePage)).replace(
        /<link\s+rel="preload"[^>]*>/g,
        "",
      );
      return html.replace(
        '<div id="root"></div>',
        `<div id="root">${markup}</div>`,
      );
    },
    closeBundle() {
      const file = path.resolve("dist/index.html");
      const html = readFileSync(file, "utf8").replace(
        /<link\b([^>]*?)>/g,
        (tag, attrs: string) => (tag.endsWith("/>") ? tag : `<link${attrs} />`),
      );
      writeFileSync(file, html);
    },
  };
}

export default defineConfig({
  base: "/resume-site/",
  plugins: [react(), prerenderResume()],
  build: {
    rollupOptions: {
      output: {
        assetFileNames(assetInfo) {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? "";
          if (name.endsWith(".css")) {
            return "styles.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === "html") {
        return filename;
      }
      return { relative: true };
    },
  },
});
