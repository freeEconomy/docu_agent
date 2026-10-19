import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { Database } from './db';
import { ApiError, textField } from './http';
const derive = promisify(scrypt);
const cookieName = 'documind_session';
const lifetime = 7 * 86400;
export type AppUser = {
  id: string;
  email: string;
  user_metadata: { name: string; company: string };
};
type UserRow = {
  id: string;
  email: string;
  name: string;
  company: string;
  password_hash: string | null;
};
function publicUser(row: UserRow): AppUser {
  return { id: row.id, email: row.email, user_metadata: { name: row.name, company: row.company } };
}
function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(':');
  const actual = (await derive(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function passwordField(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 256)
    throw new ApiError('비밀번호는 8~256자로 입력하세요.');
  return value;
}
function emailField(value: unknown) {
  const email = textField(value, '이메일', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('이메일 형식을 확인하세요.');
  return email;
}
export function sessionCookie(request: Request, token: string, maxAge = lifetime) {
  const secure = process.env.APP_ORIGIN
    ? new URL(process.env.APP_ORIGIN).protocol === 'https:'
    : new URL(request.url).protocol === 'https:';
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
export function tokenFromRequest(request: Request) {
  const raw = (request.headers.get('cookie') || '')
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName + '='))
    ?.slice(cookieName.length + 1);
  return raw && /^[a-f0-9]{64}$/.test(raw) ? raw : undefined;
}
export async function currentUser(db: Database, request: Request): Promise<AppUser | null> {
  const token = tokenFromRequest(request);
  if (!token) return null;
  const [row] = await db.query<UserRow>(
    'SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2',
    [hash(token), Date.now()],
  );
  return row ? publicUser(row) : null;
}
export async function requireUser(db: Database, request: Request) {
  const user = await currentUser(db, request);
  if (!user) throw new ApiError('로그인이 필요합니다.', 401);
  return user;
}
export function newSession() {
  const token = randomBytes(32).toString('hex');
  return { token, digest: hash(token), expires: Date.now() + lifetime * 1000 };
}
async function limit(db: Database, key: string) {
  const now = Date.now();
  const [row] = await db.query<{ attempts: number }>(
    'INSERT INTO auth_attempts(key,attempts,reset_at) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_attempts.reset_at<$3 THEN 1 ELSE auth_attempts.attempts+1 END,reset_at=CASE WHEN auth_attempts.reset_at<$3 THEN EXCLUDED.reset_at ELSE auth_attempts.reset_at END RETURNING attempts',
    [hash(key), now + 15 * 60000, now],
  );
  if (row.attempts > 10) throw new ApiError('시도가 너무 많습니다. 15분 후 다시 시도하세요.', 429);
}
export async function register(db: Database, body: Record<string, unknown>) {
  const email = emailField(body.email);
  const password = passwordField(body.password);
  const name = textField(body.name, '이름', 80);
  const company = typeof body.company === 'string' ? body.company.trim().slice(0, 80) : '';
  await limit(db, 'register:' + email);
  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  const s = newSession();
  const [row] = await db.query<UserRow>(
    `WITH u AS (INSERT INTO users(id,email,name,company,password_hash) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING RETURNING *), s AS (INSERT INTO sessions(token_hash,user_id,expires_at) SELECT $6,id,$7 FROM u RETURNING user_id) SELECT u.* FROM u JOIN s ON s.user_id=u.id`,
    [id, email, name, company, passwordHash, s.digest, s.expires],
  );
  if (!row) throw new ApiError('이미 등록된 이메일입니다.', 409);
  return { user: publicUser(row), token: s.token };
}
export async function login(db: Database, body: Record<string, unknown>) {
  const email = emailField(body.email);
  const password = passwordField(body.password);
  await limit(db, 'login:' + email);
  const [row] = await db.query<UserRow>('SELECT * FROM users WHERE email=$1', [email]);
  const valid = await verifyPassword(
    password,
    row?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64),
  );
  if (!row || !valid) throw new ApiError('이메일 또는 비밀번호를 확인하세요.', 401);
  const s = newSession();
  const results = await db.transaction([
    { text: 'DELETE FROM sessions WHERE expires_at<=$1', params: [Date.now()] },
    { text: 'DELETE FROM auth_attempts WHERE key=$1', params: [hash('login:' + email)] },
    {
      text: 'INSERT INTO sessions(token_hash,user_id,expires_at) SELECT $1,id,$2 FROM users WHERE id=$3 AND password_hash=$4 RETURNING user_id',
      params: [s.digest, s.expires, row.id, row.password_hash],
    },
  ]);
  if (!results[2].length) throw new ApiError('비밀번호가 변경되었습니다. 다시 로그인하세요.', 401);
  return { user: publicUser(row), token: s.token };
}
export async function logout(db: Database, request: Request) {
  const token = tokenFromRequest(request);
  if (token) await db.query('DELETE FROM sessions WHERE token_hash=$1', [hash(token)]);
}
export async function changePassword(db: Database, user: AppUser, body: Record<string, unknown>) {
  const old = passwordField(body.currentPassword);
  const next = passwordField(body.password);
  await limit(db, 'password:' + user.id);
  const [row] = await db.query<{ password_hash: string | null }>(
    'SELECT password_hash FROM users WHERE id=$1',
    [user.id],
  );
  if (
    !row ||
    !(await verifyPassword(
      old,
      row.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64),
    ))
  )
    throw new ApiError('현재 비밀번호가 일치하지 않습니다.', 401);
  const passwordHash = await hashPassword(next);
  const s = newSession();
  const changed = await db.query(
    `WITH u AS (UPDATE users SET password_hash=$1 WHERE id=$2 AND password_hash=$3 RETURNING id), revoked AS (DELETE FROM sessions WHERE user_id IN (SELECT id FROM u)), fresh AS (INSERT INTO sessions(token_hash,user_id,expires_at) SELECT $4,id,$5 FROM u RETURNING user_id) SELECT * FROM fresh`,
    [passwordHash, user.id, row.password_hash, s.digest, s.expires],
  );
  if (!changed.length) throw new ApiError('비밀번호가 변경되었습니다. 다시 로그인하세요.', 409);
  return s.token;
}
