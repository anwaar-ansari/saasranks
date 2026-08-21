export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function supabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function hasSupabaseAdmin() {
  return Boolean(supabaseUrl() && supabaseServiceRoleKey());
}

export function hasSupabasePublic() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

export function allowDemoBoard() {
  return process.env.NODE_ENV !== "production" && !hasSupabaseAdmin();
}
