import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseUrl, supabasePublishableKey } from './config';
let instance: SupabaseClient<Database> | undefined;
export function getSupabase() {
  return (instance ??= createClient<Database>(supabaseUrl, supabasePublishableKey));
}
export async function apiRequest(path: string, body: unknown) {
  const client = getSupabase();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error || !session) throw new Error('로그인이 필요합니다.');
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '요청에 실패했습니다.');
  return result;
}
