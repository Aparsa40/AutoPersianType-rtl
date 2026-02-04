import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";
import express, { type Express } from "express";
import runApp from "./app";

/**
 * Serve built client files in production
 */
export async function serveStatic(app: Express, _server: Server) {
  // مسیر خروجی Vite که در vite.config.ts تعریف شده (dist/)
  const distPath = path.resolve(import.meta.dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Build output not found at ${distPath}. Did you run vite build?`,
    );
  }

  app.use(
    express.static(distPath, {
      index: false,
    }),
  );

  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

(async () => {
  // runApp فقط یک آرگومان می‌گیرد
  await runApp(serveStatic);
})();
