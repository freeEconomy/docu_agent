// Publishable keys identify the project; authorization is enforced by Auth + RLS.
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uyckuziyzjqterrsgvhg.supabase.co';
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_F84gyIHe7UcpcS32DzWWzQ_sSaq6Lt5';
export const documentBucket = 'documents';
