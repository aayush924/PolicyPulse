import { Router, Request, Response } from "express";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export const engineProxy = Router();

engineProxy.post("/ingest", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/ingest/`, {
      method: "POST",
      body: req.body,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const data = await engineRes.json();
    res.status(engineRes.status).json(data);
  } catch (error) {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.post("/query", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/query/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await engineRes.json();
    res.status(engineRes.status).json(data);
  } catch (error) {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.get("/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/health`);
    const data = await engineRes.json();
    res.json(data);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});
