import { type Server } from "node:http";
import os from "node:os";
import open from "open";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

/* -------------------- Logger -------------------- */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/* -------------------- App -------------------- */
export const app = express();

/* rawBody support */
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

/* -------------------- Request Logger -------------------- */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/* -------------------- Runner -------------------- */
export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  /* Error handler */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // setup نهایی (Vite / SSR / ...)
  await setup(app, server);

  /* -------------------- Listen -------------------- */
  const port = parseInt(process.env.PORT || "8080", 10);
  const host = "127.0.0.1";
  const isWindows = os.platform() === "win32";

  server.listen(
    {
      port,
      host,
      ...(isWindows ? {} : { reusePort: true }),
    },
    async () => {
      const url = `http://${host}:${port}`;
      log(`Server running on ${url}`);

      // باز کردن خودکار مرورگر
      try {
        await open(url);
      } catch (err) {
        log(
          `Could not open browser automatically: ${
            (err as Error).message
          }`,
        );
      }
    },
  );
}
