import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { generateKeyPair, SignJWT, type JWTPayload } from 'jose';
import type { Database, Row } from '../lib/server/db';
import { register, login, currentUser } from '../lib/server/auth';
import {
  googleConfig,
  startGoogle,
  consumeAttempt,
  verifyGoogleToken,
  googleSession,
  finishGoogle,
  SSOError,
} from '../lib/server/google-sso';

test('Google Workspace SSO identity, browser binding and account ownership', async (t) => {
  const envKeys = [
    'APP_ORIGIN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_WORKSPACE_DOMAINS',
    'GOOGLE_ALLOW_PERSONAL_ACCOUNTS',
  ];
  const old = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    APP_ORIGIN: 'https://documind.example',
    GOOGLE_CLIENT_ID: 'test-client',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_WORKSPACE_DOMAINS: 'example.com',
    GOOGLE_ALLOW_PERSONAL_ACCOUNTS: 'false',
  });
  const pg = new PGlite();
  const db: Database = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query(text, params)).rows as T[];
    },
    async transaction(statements) {
      return pg.transaction(async (tx) => {
        const out: Row[][] = [];
        for (const s of statements)
          out.push((await tx.query(s.text, s.params || [])).rows as Row[]);
        return out;
      });
    },
  };
  try {
    for (const file of ['001_neon.sql', '002_google_sso.sql', '002_google_sso.sql'])
      await pg.exec(await readFile('migrations/' + file, 'utf8'));
    const config = googleConfig()!;
    const keys = await generateKeyPair('RS256');
    const claims: JWTPayload = {
      sub: 'google-subject',
      email: 'member@example.com',
      email_verified: true,
      hd: 'example.com',
      nonce: 'expected-nonce',
      name: 'Member',
    };
    const sign = (overrides: JWTPayload = {}) =>
      new SignJWT({ ...claims, ...overrides })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuer('https://accounts.google.com')
        .setAudience(config.clientId)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(keys.privateKey);
    const profile = await verifyGoogleToken(await sign(), 'expected-nonce', config, keys.publicKey);
    await t.test(
      'verified Google identity requires trusted signature, issuer, audience, nonce, freshness and Workspace domain',
      async () => {
        assert.equal(profile.email, 'member@example.com');
        for (const overrides of [
          { nonce: 'wrong' },
          { email_verified: false },
          { hd: 'attacker.example' },
          { hd: undefined },
          { azp: 'wrong' },
          { email: 'invalid' },
        ]) {
          await assert.rejects(
            verifyGoogleToken(await sign(overrides), 'expected-nonce', config, keys.publicKey),
          );
        }
        const wrongIssuer = await new SignJWT(claims)
          .setProtectedHeader({ alg: 'RS256' })
          .setIssuer('https://attacker.example')
          .setAudience(config.clientId)
          .setIssuedAt()
          .setExpirationTime('5m')
          .sign(keys.privateKey);
        await assert.rejects(
          verifyGoogleToken(wrongIssuer, 'expected-nonce', config, keys.publicKey),
        );
        const wrongAudience = await new SignJWT(claims)
          .setProtectedHeader({ alg: 'RS256' })
          .setIssuer('https://accounts.google.com')
          .setAudience('wrong-client')
          .setIssuedAt()
          .setExpirationTime('5m')
          .sign(keys.privateKey);
        await assert.rejects(
          verifyGoogleToken(wrongAudience, 'expected-nonce', config, keys.publicKey),
        );
        const expired = await new SignJWT(claims)
          .setProtectedHeader({ alg: 'RS256' })
          .setIssuer('https://accounts.google.com')
          .setAudience(config.clientId)
          .setIssuedAt()
          .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
          .sign(keys.privateKey);
        await assert.rejects(verifyGoogleToken(expired, 'expected-nonce', config, keys.publicKey));
        const attacker = await generateKeyPair('RS256');
        await assert.rejects(
          verifyGoogleToken(await sign(), 'expected-nonce', config, attacker.publicKey),
        );
      },
    );
    await t.test(
      'personal Gmail requires explicit opt-in and retains verified email and Workspace restrictions',
      async () => {
        const gmail = await sign({ email: 'member@gmail.com', hd: undefined });
        await assert.rejects(verifyGoogleToken(gmail, 'expected-nonce', config, keys.publicKey));
        const mixed = { ...config, allowPersonal: true };
        assert.equal(
          (await verifyGoogleToken(gmail, 'expected-nonce', mixed, keys.publicKey)).email,
          'member@gmail.com',
        );
        await verifyGoogleToken(await sign(), 'expected-nonce', mixed, keys.publicKey);
        await assert.rejects(
          verifyGoogleToken(
            await sign({ email: 'member@gmail.com', hd: undefined, email_verified: false }),
            'expected-nonce',
            mixed,
            keys.publicKey,
          ),
        );
        await assert.rejects(
          verifyGoogleToken(
            await sign({ hd: 'other.example' }),
            'expected-nonce',
            mixed,
            keys.publicKey,
          ),
        );
        await assert.rejects(
          verifyGoogleToken(
            await sign({ email: 'member@other.example', hd: undefined }),
            'expected-nonce',
            mixed,
            keys.publicKey,
          ),
        );
        process.env.GOOGLE_ALLOW_PERSONAL_ACCOUNTS = 'true';
        try {
          const response = await startGoogle(
            db,
            new Request(config.origin + '/api/auth/sso/google/start'),
          );
          assert.equal(new URL(response.headers.get('location')!).searchParams.has('hd'), false);
        } finally {
          process.env.GOOGLE_ALLOW_PERSONAL_ACCOUNTS = 'false';
        }
      },
    );
    async function start() {
      const response = await startGoogle(
        db,
        new Request(config.origin + '/api/auth/sso/google/start'),
      );
      const url = new URL(response.headers.get('location')!);
      const cookie = response.headers.get('set-cookie')!;
      return {
        response,
        url,
        cookie,
        browser: cookie.split(';')[0].split('=')[1],
        state: url.searchParams.get('state')!,
      };
    }
    await t.test(
      'authorization uses PKCE S256, nonce, secure HttpOnly cookie and one-use state bound to browser',
      async () => {
        const flow = await start();
        assert.equal(flow.url.origin, 'https://accounts.google.com');
        assert.equal(flow.url.searchParams.get('redirect_uri'), config.redirectUri);
        assert.equal(flow.url.searchParams.get('code_challenge_method'), 'S256');
        assert.match(flow.cookie, /HttpOnly/);
        assert.match(flow.cookie, /SameSite=Lax/);
        assert.match(flow.cookie, /Secure/);
        await assert.rejects(consumeAttempt(db, flow.state, randomBytes(32).toString('base64url')));
        const attempt = await consumeAttempt(db, flow.state, flow.browser);
        assert.equal(
          createHash('sha256').update(attempt.verifier).digest('base64url'),
          flow.url.searchParams.get('code_challenge'),
        );
        assert.equal(attempt.nonce, flow.url.searchParams.get('nonce'));
        await assert.rejects(consumeAttempt(db, flow.state, flow.browser));
        const expired = await start();
        await db.query('UPDATE oauth_attempts SET expires_at=0');
        await assert.rejects(consumeAttempt(db, expired.state, expired.browser));
      },
    );
    await t.test(
      'cancellation clears cookie and returns only a fixed message, replay and unsolicited callback rejected',
      async () => {
        const flow = await start();
        const request = new Request(
          config.redirectUri +
            '?state=' +
            flow.state +
            '&error=access_denied&error_description=secret',
          { headers: { Cookie: flow.cookie.split(';')[0] } },
        );
        const result = await finishGoogle(db, request);
        assert.equal(result.headers.get('location'), config.origin + '/login?sso_error=cancelled');
        assert.match(result.headers.get('set-cookie')!, /Max-Age=0/);
        assert.equal(
          (await finishGoogle(db, request)).headers.get('location'),
          config.origin + '/login?sso_error=expired',
        );
      },
    );
    let memberId = '';
    const req = (token: string) =>
      new Request(config.origin, { headers: { Cookie: 'documind_session=' + token } });
    await t.test(
      'new Google login persists identity and session without setting a usable password',
      async () => {
        const token = await googleSession(db, profile);
        const user = await currentUser(db, req(token));
        assert.ok(user);
        memberId = user.id;
        const [row] = await db.query<{ password_hash: string | null }>(
          'SELECT password_hash FROM users WHERE id=$1',
          [memberId],
        );
        assert.equal(row.password_hash, null);
        await assert.rejects(login(db, { email: profile.email, password: 'Password123!' }));
        const again = await googleSession(db, { ...profile, email: 'changed@example.com' });
        assert.equal((await currentUser(db, req(again)))?.id, memberId);
        assert.equal((await db.query('SELECT * FROM users')).length, 1);
      },
    );
    const local = await register(db, {
      email: 'existing@example.com',
      password: 'Password123!',
      name: 'Local',
    });
    const existing = { ...profile, subject: 'local-google-subject', email: 'existing@example.com' };
    await t.test(
      'matching email cannot take over existing account; signed-in explicit linking preserves local user and documents',
      async () => {
        await assert.rejects(
          googleSession(db, existing),
          (e) => e instanceof SSOError && e.code === 'account_exists',
        );
        await assert.rejects(
          startGoogle(
            db,
            new Request(config.origin + '/api/auth/sso/google/link', {
              method: 'POST',
              headers: { Origin: 'https://attacker.example' },
            }),
            true,
          ),
        );
        await assert.rejects(
          startGoogle(
            db,
            new Request(config.origin + '/api/auth/sso/google/link', { method: 'POST' }),
            true,
          ),
        );
        const response = await startGoogle(
          db,
          new Request(config.origin + '/api/auth/sso/google/link', {
            method: 'POST',
            headers: { Origin: config.origin, Cookie: 'documind_session=' + local.token },
          }),
          true,
        );
        const url = new URL((await response.json()).url);
        const browser = response.headers.get('set-cookie')!.split(';')[0].split('=')[1];
        const attempt = await consumeAttempt(db, url.searchParams.get('state')!, browser);
        assert.equal(attempt.link_user_id, local.user.id);
        const token = await googleSession(db, existing, attempt.link_user_id);
        assert.equal((await currentUser(db, req(token)))?.id, local.user.id);
        assert.equal(
          (await login(db, { email: 'existing@example.com', password: 'Password123!' })).user.id,
          local.user.id,
        );
        assert.equal(
          (await currentUser(db, req(await googleSession(db, existing))))?.id,
          local.user.id,
        );
        await assert.rejects(googleSession(db, existing, memberId));
        await assert.rejects(
          googleSession(db, { ...existing, subject: 'different-google-subject' }, local.user.id),
        );
        assert.equal((await db.query('SELECT * FROM users')).length, 2);
      },
    );
    await t.test('link callback requires the same current local account', async () => {
      const response = await startGoogle(
        db,
        new Request(config.origin + '/api/auth/sso/google/link', {
          method: 'POST',
          headers: { Origin: config.origin, Cookie: 'documind_session=' + local.token },
        }),
        true,
      );
      const url = new URL((await response.json()).url);
      const cookie = response.headers.get('set-cookie')!.split(';')[0];
      const result = await finishGoogle(
        db,
        new Request(config.redirectUri + '?state=' + url.searchParams.get('state') + '&code=test', {
          headers: { Cookie: cookie },
        }),
      );
      assert.equal(result.headers.get('location'), config.origin + '/settings?sso_error=expired');
    });
    await t.test(
      'missing configuration disables provider, preview origin cannot start production SSO',
      async () => {
        await assert.rejects(
          startGoogle(db, new Request('https://preview.example/api/auth/sso/google/start')),
        );
        delete process.env.GOOGLE_WORKSPACE_DOMAINS;
        assert.equal(googleConfig(), null);
        await assert.rejects(
          startGoogle(db, new Request(config.origin + '/api/auth/sso/google/start')),
        );
      },
    );
  } finally {
    await pg.close();
    for (const key of envKeys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  }
});
