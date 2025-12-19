import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";
import express, { type Express } from "express";
import runApp from "./app";

/**
 * Serve built client files in production
 */
export async function serveStatic(app: Express, _server: Server) {
  const distPublicPath = path.resolve(
    import.meta.dirname,
    "..",
    "dist",
    "public",
  );

  if (!fs.existsSync(distPublicPath)) {
    throw new Error(
      `Build output not found at ${distPublicPath}. Did you run vite build?`,
    );
  }

  app.use(
    express.static(distPublicPath, {
      index: false,
    }),
  );

  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPublicPath, "index.html"));
  });
}

(async () => {
  // runApp فقط یک آرگومان می‌گیرد
  await runApp(serveStatic);
})();
