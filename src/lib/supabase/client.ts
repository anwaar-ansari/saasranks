import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./env";

export function createSupabaseBrowser() {
  const url = supabaseUrl();
  const key = supabasePublishableKey();
  if (!url || !key) {
    throw new Error("Supabase public env is not configured.");
  }
  return createBrowserClient(url, key);
}
