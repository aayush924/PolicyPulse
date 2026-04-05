import { Router, Request, Response } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }
  return _supabase;
}

export const authRouter = Router();

authRouter.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await getSupabase().auth.signUp({ email, password });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ user: data.user, session: data.session });
});

authRouter.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ user: data.user, session: data.session });
});

authRouter.post("/signout", async (_req: Request, res: Response): Promise<void> => {
  const { error } = await getSupabase().auth.signOut();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: "Signed out successfully" });
});
