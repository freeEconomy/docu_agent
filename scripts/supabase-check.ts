import { supabaseUrl, supabasePublishableKey } from '../lib/supabase/config';

// Read-only checks against the same project configuration as the app.
// Never creates users, writes documents, logs credentials or disables RLS.
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(supabaseUrl + path, {
    ...init,
    headers: { apikey: supabasePublishableKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}
async function main() {
  let failures = 0;
  function report(name: string, passed: boolean, detail: string) {
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
    if (!passed) failures++;
  }
  try {
    console.log('Checking Supabase project:', new URL(supabaseUrl).hostname);
    const auth = await request('/auth/v1/settings');
    report('Auth connectivity', auth.status === 200, `HTTP ${auth.status}`);
    if (auth.status === 200) {
      report(
        'Email authentication',
        auth.body?.external?.email === true,
        auth.body?.external?.email ? 'enabled' : 'disabled',
      );
      report(
        'Account registration',
        auth.body?.disable_signup === false,
        auth.body?.disable_signup ? 'disabled' : 'enabled',
      );
    }
    for (const table of ['documents', 'document_chunks', 'conversations', 'chat_turns']) {
      const result = await request(`/rest/v1/${table}?select=id&limit=1`);
      const denied = [401, 403].includes(result.status) && result.body?.code === '42501';
      report(
        `Table ${table}`,
        denied,
        denied
          ? 'table resolved; unauthenticated access denied'
          : `HTTP ${result.status}, code ${result.body?.code || 'none'} (expected permission denial)`,
      );
    }
    const search = await request('/rest/v1/rpc/search_document_chunks', {
      method: 'POST',
      body: JSON.stringify({ query_text: 'connection check', selected_ids: null }),
    });
    const denied = [401, 403].includes(search.status) && search.body?.code === '42501';
    report(
      'Search RPC',
      denied,
      denied
        ? 'function resolved; unauthenticated execution denied'
        : `HTTP ${search.status}, code ${search.body?.code || 'none'}`,
    );
    console.log(
      'Scope: project reachability, email auth settings, table/RPC presence and anonymous-access denial. Signed-in upload/chat require an authenticated user and are not verified by this check.',
    );
  } catch {
    failures++;
    console.error(
      'FAIL Network request did not complete. Check DNS, HTTPS egress policy and project availability. No authentication values were logged.',
    );
  }
  process.exitCode = failures ? 1 : 0;
}
void main();
