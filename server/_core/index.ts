
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // One-time admin setup route — delete after use
  app.get("/api/setup-admin", async (req, res) => {
    const secret = req.query.secret;
    if (secret !== process.env.JWT_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const db = await import("../db");
      const user = await db.getUserByEmail("barcavini17@gmail.com");
      if (!user) return res.status(404).json({ error: "User not found" });
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const mysql2 = require("mysql2/promise");
      const connection = mysql2.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      const dbInstance = drizzle(connection);
      await dbInstance.update(users).set({ role: "admin" }).where(eq(users.email, "barcavini17@gmail.com"));
      return res.json({ success: true, message: "Admin role granted to barcavini17@gmail.com" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
