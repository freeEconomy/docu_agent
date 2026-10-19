import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey, type KeyLike } from 'jose';
import type { Database } from './db';
import { currentUser, newSession, sessionCookie } from './auth';
import { ApiError, checkOrigin, json } from './http';

const cookieName = (request: Request) =>
  new URL(request.url).protocol === 'https:'
    ? '__Host-documind_google_oauth'
    : 'documind_google_oauth';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export class SSOError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const origin = process.env.APP_ORIGIN?.trim();
  const domains = (process.env.GOOGLE_WORKSPACE_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (!clientId || !clientSecret || !origin || !domains.length) return null;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  if (
    domains.some(
      (domain) =>
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain),
    )
  )
    return null;
  if (
    url.origin !== origin ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
  )
    return null;
  return {
    clientId,
    clientSecret,
    origin,
    domains,
    redirectUri: origin + '/api/auth/sso/google/callback',
  };
}
function flowCookie(request: Request, value: string, maxAge: number) {
  return `${cookieName(request)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
function redirect(url: string, cookies: string[]) {
  const headers = new Headers({
    Location: url,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}
export async function startGoogle(db: Database, request: Request, link = false) {
  const config = googleConfig();
  if (!config) throw new ApiError('Google Workspace SSO 설정이 아직 완료되지 않았습니다.', 503);
  if (new URL(request.url).origin !== config.origin)
    throw new ApiError('등록된 운영 주소에서 SSO를 시작하세요.', 400);
  if (link) checkOrigin(request);
  const user = link ? await currentUser(db, request) : null;
  if (link && !user) throw new ApiError('로그인 후 Google 계정을 연결하세요.', 401);
  const state = random(),
    browser = random(),
    verifier = random(),
    nonce = random();
  await db.transaction([
    { text: 'DELETE FROM oauth_attempts WHERE expires_at<$1', params: [Date.now()] },
    {
      text: 'INSERT INTO oauth_attempts(state_hash,browser_hash,verifier,nonce,link_user_id,expires_at) VALUES($1,$2,$3,$4,$5,$6)',
      params: [
        hash(state),
        hash(browser),
        verifier,
        nonce,
        user?.id || null,
        Date.now() + 10 * 60000,
      ],
    },
  ]);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
    ...(config.domains.length === 1 ? { hd: config.domains[0] } : {}),
  }).toString();
  return link
    ? json({ url: url.href }, 200, { 'Set-Cookie': flowCookie(request, browser, 600) })
    : redirect(url.href, [flowCookie(request, browser, 600)]);
}
export type GoogleProfile = { subject: string; email: string; name: string };
export async function verifyGoogleToken(
  token: string,
  nonce: string,
  config: NonNullable<ReturnType<typeof googleConfig>>,
  key: JWTVerifyGetKey | KeyLike = googleKeys,
): Promise<GoogleProfile> {
  // Only Google's configured keys are trusted; token-supplied key URLs are ignored.
  const { payload } = await jwtVerify(token, key as JWTVerifyGetKey, {
    algorithms: ['RS256'],
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: config.clientId,
    requiredClaims: ['exp', 'iat', 'sub', 'nonce', 'email', 'email_verified', 'hd'],
    clockTolerance: 5,
    maxTokenAge: '10m',
  });
  if (
    payload.nonce !== nonce ||
    (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== config.clientId) ||
    (payload.azp !== undefined && payload.azp !== config.clientId) ||
    payload.email_verified !== true ||
    typeof payload.sub !== 'string' ||
    !payload.sub ||
    payload.sub.length > 255 ||
    typeof payload.email !== 'string' ||
    payload.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
  )
    throw new SSOError('invalid_identity');
  if (typeof payload.hd !== 'string' || !config.domains.includes(payload.hd.toLowerCase()))
    throw new SSOError('domain_denied');
  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    name:
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim().slice(0, 80)
        : payload.email.split('@')[0].slice(0, 80),
  };
}
export async function consumeAttempt(db: Database, state: string, browser: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(browser))
    throw new SSOError('expired');
  const [attempt] = await db.query<{
    verifier: string;
    nonce: string;
    link_user_id: string | null;
  }>(
    'DELETE FROM oauth_attempts WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>$3 RETURNING verifier,nonce,link_user_id',
    [hash(state), hash(browser), Date.now()],
  );
  if (!attempt) throw new SSOError('expired');
  return attempt;
}
export async function googleSession(
  db: Database,
  profile: GoogleProfile,
  linkUserId: string | null = null,
) {
  const session = newSession();
  const userId = randomUUID();
  const results = await db.transaction([
    // Serialize identity creation across concurrent callbacks. Email conflicts never attach an identity.
    {
      text: 'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      params: ['google:' + profile.subject],
    },
    ...(linkUserId
      ? [
          {
            text: "INSERT INTO sso_identities(provider,subject,user_id,email) SELECT 'google',$1,id,$2 FROM users WHERE id=$3 ON CONFLICT DO NOTHING",
            params: [profile.subject, profile.email, linkUserId],
          },
        ]
      : [
          {
            text: "INSERT INTO users(id,email,name,password_hash) SELECT $1,$2,$3,NULL WHERE NOT EXISTS(SELECT 1 FROM sso_identities WHERE provider='google' AND subject=$4) ON CONFLICT(email) DO NOTHING",
            params: [userId, profile.email, profile.name, profile.subject],
          },
          {
            text: "INSERT INTO sso_identities(provider,subject,user_id,email) SELECT 'google',$1,id,$2 FROM users WHERE id=$3 ON CONFLICT DO NOTHING",
            params: [profile.subject, profile.email, userId],
          },
        ]),
    {
      text: "INSERT INTO sessions(token_hash,user_id,expires_at) SELECT $1,user_id,$2 FROM sso_identities WHERE provider='google' AND subject=$3 AND ($4::uuid IS NULL OR user_id=$4::uuid) RETURNING user_id",
      params: [session.digest, session.expires, profile.subject, linkUserId],
    },
  ]);
  const rows = results[results.length - 1];
  if (!rows.length) throw new SSOError(linkUserId ? 'link_conflict' : 'account_exists');
  return session.token;
}
export async function finishGoogle(db: Database, request: Request) {
  const config = googleConfig();
  const clear = flowCookie(request, '', 0);
  let destination = '/login';
  try {
    if (!config || new URL(request.url).origin !== config.origin)
      throw new SSOError('not_configured');
    const url = new URL(request.url);
    const browser =
      (request.headers.get('cookie') || '')
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(cookieName(request) + '='))
        ?.slice(cookieName(request).length + 1) || '';
    const attempt = await consumeAttempt(db, url.searchParams.get('state') || '', browser);
    if (attempt.link_user_id) {
      destination = '/settings';
      const user = await currentUser(db, request);
      if (user?.id !== attempt.link_user_id) throw new SSOError('expired');
    }
    if (url.searchParams.has('error')) throw new SSOError('cancelled');
    const code = url.searchParams.get('code');
    if (!code || code.length > 4096) throw new SSOError('invalid_identity');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        code_verifier: attempt.verifier,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
    if (!response.ok) throw new SSOError('invalid_identity');
    const tokens = await response.json();
    if (typeof tokens.id_token !== 'string') throw new SSOError('invalid_identity');
    const profile = await verifyGoogleToken(tokens.id_token, attempt.nonce, config);
    const token = await googleSession(db, profile, attempt.link_user_id);
    return redirect(config.origin + (attempt.link_user_id ? '/settings?sso=linked' : '/chat'), [
      clear,
      sessionCookie(request, token),
    ]);
  } catch (error) {
    const code = error instanceof SSOError ? error.code : 'failed';
    return redirect(
      (config?.origin || new URL(request.url).origin) + destination + '?sso_error=' + code,
      [clear],
    );
  }
}
