import { Router, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8000";

export const engineProxy = Router();

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user?.id ?? "";
}

async function forwardJson(engineRes: globalThis.Response, res: Response): Promise<void> {
  const text = await engineRes.text();
  try {
    const data = JSON.parse(text);
    res.status(engineRes.status).json(data);
  } catch {
    res.status(engineRes.status).json({ error: text || "Engine error" });
  }
}

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

engineProxy.get("/policies/cross-reference", async (_req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/policies/cross-reference`);
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

// ── Chat proxy ───────────────────────────────────────────────────────

engineProxy.get("/chat/conversations", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/chat/conversations`, {
      headers: { "X-User-ID": getUserId(req) },
    });
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.post("/chat/conversations", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(`${ENGINE_URL}/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(req),
      },
    });
    await forwardJson(engineRes, res);
  } catch (error) {
    console.error("Chat create conversation proxy error:", error);
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.get("/chat/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}`,
      { headers: { "X-User-ID": getUserId(req) } },
    );
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.delete("/chat/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}`,
      {
        method: "DELETE",
        headers: { "X-User-ID": getUserId(req) },
      },
    );
    if (engineRes.status === 204) {
      res.status(204).end();
      return;
    }
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.post("/chat/conversations/:id/documents", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}/documents`,
      {
        method: "POST",
        body: req.body,
        headers: {
          ...Object.fromEntries(
            Object.entries(req.headers).filter(([key]) => 
              key !== "host" && key !== "connection" && key !== "content-length"
            )
          ),
          "X-User-ID": getUserId(req),
        },
        duplex: "half",
      } as RequestInit & { duplex: "half" },
    );
    await forwardJson(engineRes, res);
  } catch (error) {
    console.error("Chat upload document proxy error:", error);
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.get("/chat/conversations/:id/documents", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}/documents`,
      { headers: { "X-User-ID": getUserId(req) } },
    );
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.delete("/chat/conversations/:id/documents/:docId", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}/documents/${req.params.docId}`,
      {
        method: "DELETE",
        headers: { "X-User-ID": getUserId(req) },
      },
    );
    if (engineRes.status === 204) {
      res.status(204).end();
      return;
    }
    await forwardJson(engineRes, res);
  } catch {
    res.status(502).json({ error: "Engine service unavailable" });
  }
});

engineProxy.post("/chat/conversations/:id/messages", async (req: Request, res: Response): Promise<void> => {
  try {
    const engineRes = await fetch(
      `${ENGINE_URL}/chat/conversations/${req.params.id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": getUserId(req),
        },
        body: JSON.stringify(req.body),
      },
    );
    await forwardJson(engineRes, res);
  } catch (error) {
    console.error("Chat send message proxy error:", error);
    res.status(502).json({ error: "Engine service unavailable" });
  }
});
