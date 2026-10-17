import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseUrl, supabasePublishableKey } from './config';
export async function authenticatedClient(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new ApiError('로그인이 필요합니다.', 401);
  const client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(authorization.slice(7));
  if (error || !user) throw new ApiError('인증이 만료되었습니다. 다시 로그인하세요.', 401);
  return { client, user };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown) {
  if (!(error instanceof ApiError))
    console.error('API operation failed', error instanceof Error ? error.message : 'Unknown error');
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : '서버 처리에 실패했습니다. 잠시 후 다시 시도하세요.',
    },
    { status: error instanceof ApiError ? error.status : 500 },
  );
}
export function checkDb(error: { message: string } | null) {
  if (error)
    throw new ApiError(
      '데이터베이스 요청에 실패했습니다. 테이블 설치 및 접근 권한을 확인하세요.',
      503,
    );
}
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
