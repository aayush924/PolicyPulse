import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import { engineProxy } from "./routes/engine-proxy.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.GATEWAY_PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.use("/auth", authRouter);

app.use("/api", authMiddleware, engineProxy);

app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
});
