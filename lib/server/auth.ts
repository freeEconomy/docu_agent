import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { DatabaseSync } from 'node:sqlite';
import { ApiError, textField } from './http';
import { transaction } from './db';
const derive = promisify(scrypt);
const cookieName = 'documind_session';
const lifetime = 7 * 86400;
export type AppUser = {
  id: string;
  email: string;
  user_metadata: { name: string; company: string };
};
type UserRow = { id: string; email: string; name: string; company: string; password_hash: string };
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
export function currentUser(db: DatabaseSync, request: Request): AppUser | null {
  const token = tokenFromRequest(request);
  if (!token) return null;
  const row = db
    .prepare(
      'SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',
    )
    .get(hash(token), Date.now()) as UserRow | undefined;
  return row ? publicUser(row) : null;
}
export function requireUser(db: DatabaseSync, request: Request) {
  const user = currentUser(db, request);
  if (!user) throw new ApiError('로그인이 필요합니다.', 401);
  return user;
}
function createSession(db: DatabaseSync, userId: string) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
    hash(token),
    userId,
    Date.now() + lifetime * 1000,
  );
  return token;
}
function limit(db: DatabaseSync, key: string) {
  const digest = hash(key);
  const now = Date.now();
  db.prepare(
    'INSERT INTO auth_attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END',
  ).run(digest, now + 15 * 60000, now, now);
  const row = db.prepare('SELECT attempts FROM auth_attempts WHERE key=?').get(digest) as {
    attempts: number;
  };
  if (row.attempts > 10) throw new ApiError('시도가 너무 많습니다. 15분 후 다시 시도하세요.', 429);
}
export async function register(db: DatabaseSync, body: Record<string, unknown>) {
  const email = emailField(body.email);
  const password = passwordField(body.password);
  const name = textField(body.name, '이름', 80);
  const company = typeof body.company === 'string' ? body.company.trim().slice(0, 80) : '';
  limit(db, 'register:' + email);
  const passwordHash = await hashPassword(password);
  return transaction(db, () => {
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
      throw new ApiError('이미 등록된 이메일입니다.', 409);
    const id = randomUUID();
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
      id,
      email,
      name,
      company,
      passwordHash,
      new Date().toISOString(),
    );
    return {
      user: publicUser({ id, email, name, company, password_hash: passwordHash }),
      token: createSession(db, id),
    };
  });
}
export async function login(db: DatabaseSync, body: Record<string, unknown>) {
  const email = emailField(body.email);
  const password = passwordField(body.password);
  limit(db, 'login:' + email);
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(email) as UserRow | undefined;
  const valid = await verifyPassword(
    password,
    row?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64),
  );
  if (!row || !valid) throw new ApiError('이메일 또는 비밀번호를 확인하세요.', 401);
  db.prepare('DELETE FROM auth_attempts WHERE key=?').run(hash('login:' + email));
  return { user: publicUser(row), token: createSession(db, row.id) };
}
export function logout(db: DatabaseSync, request: Request) {
  const token = tokenFromRequest(request);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
}
export async function changePassword(
  db: DatabaseSync,
  user: AppUser,
  body: Record<string, unknown>,
) {
  const old = passwordField(body.currentPassword);
  const next = passwordField(body.password);
  limit(db, 'password:' + user.id);
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id) as {
    password_hash: string;
  };
  if (!(await verifyPassword(old, row.password_hash)))
    throw new ApiError('현재 비밀번호가 일치하지 않습니다.', 401);
  const passwordHash = await hashPassword(next);
  return transaction(db, () => {
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash, user.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    return createSession(db, user.id);
  });
}
