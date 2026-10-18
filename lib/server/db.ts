import { neon, neonConfig } from '@neondatabase/serverless';
import { ApiError } from './http';
export type Row = Record<string, unknown>;
export type Statement = { text: string; params?: unknown[] };
export interface Database {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  transaction(statements: Statement[]): Promise<Row[][]>;
}
export function createDatabase(url: string): Database {
  if (!url)
    throw new ApiError(
      'Neon 연결이 아직 설정되지 않았습니다. 서버 환경 변수 DATABASE_URL을 등록하세요.',
      503,
    );
  const endpoint = process.env.DOCUMIND_TEST_NEON_URL;
  if (endpoint) {
    if (
      process.env.VERCEL ||
      process.env.DOCUMIND_TEST_MODE !== '1' ||
      new URL(endpoint).hostname !== '127.0.0.1'
    )
      throw new Error('Test endpoint is only allowed for isolated local tests');
    neonConfig.fetchEndpoint = () => endpoint;
  }
  const httpEndpoint = process.env.NEON_HTTP_ENDPOINT;
  if (httpEndpoint) {
    const parsed = new URL(httpEndpoint);
    if (
      parsed.protocol !== 'https:' ||
      !parsed.hostname.endsWith('.neon.tech') ||
      parsed.pathname !== '/sql'
    )
      throw new ApiError('NEON_HTTP_ENDPOINT는 Neon의 HTTPS /sql 주소여야 합니다.', 503);
    neonConfig.fetchEndpoint = () => httpEndpoint;
  }
  // Proxy-bound secrets may be opaque locally. With a public HTTP endpoint,
  // forward the connection string only in the Neon request header so the
  // configured credential proxy can substitute it at the approved destination.
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://') && !httpEndpoint)
    throw new ApiError('프록시 연결 정보에는 공개 NEON_HTTP_ENDPOINT 설정이 필요합니다.', 503);
  const sql = neon(
    url.startsWith('postgres') ? url : 'postgresql://proxy:placeholder@ep-proxy.neon.tech/db',
    httpEndpoint
      ? {
          fetchOptions: {
            headers: {
              'Neon-Connection-String': url,
              'Neon-Raw-Text-Output': 'true',
              'Neon-Array-Mode': 'true',
            },
          },
        }
      : undefined,
  );
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await sql.query(text, params)) as T[];
    },
    async transaction(statements) {
      return await sql.transaction(statements.map((s) => sql.query(s.text, s.params || [])));
    },
  };
}
let singleton: Database | undefined;
export function getDb() {
  return (singleton ??= createDatabase(process.env.DATABASE_URL || ''));
}
