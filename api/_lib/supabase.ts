import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export function adminClient(): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function authenticate(req: { headers: Record<string, string | string[] | undefined> }) {
  const auth = req.headers['authorization'] ?? req.headers['Authorization'];
  const header = Array.isArray(auth) ? auth[0] : auth;
  if (!header?.startsWith('Bearer ')) return { token: null, userId: null as string | null };
  const token = header.slice('Bearer '.length);
  const supabase = userClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { token, userId: null };
  return { token, userId: data.user.id };
}
