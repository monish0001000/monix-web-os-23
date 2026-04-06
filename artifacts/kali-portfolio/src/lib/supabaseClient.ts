import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("[MONIX OS] Supabase credentials missing — cloud features disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseReady = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
