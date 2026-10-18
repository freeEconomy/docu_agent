export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function json(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
export function errorResponse(error: unknown) {
  if (!(error instanceof ApiError))
    console.error(
      'Server operation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  return json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : process.env.VERCEL
            ? 'SQLite 모드는 영구 디스크가 있는 Node.js 서버에서 실행해야 합니다.'
            : '서버 처리에 실패했습니다. 저장 공간과 서버 로그를 확인하세요.',
    },
    error instanceof ApiError ? error.status : 500,
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== allowed)
    throw new ApiError('다른 사이트에서 보낸 요청은 허용하지 않습니다.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    throw new ApiError('다른 사이트에서 보낸 요청은 허용하지 않습니다.', 403);
}
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > 16384)
    throw new ApiError('요청 데이터가 너무 큽니다.', 413);
  const reader = request.body?.getReader();
  const pieces: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16384) {
        await reader.cancel();
        throw new ApiError('요청 데이터가 너무 큽니다.', 413);
      }
      pieces.push(value);
    }
  }
  try {
    const value = JSON.parse(Buffer.concat(pieces).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new ApiError('올바른 JSON 요청이 필요합니다.');
  }
}
export function textField(value: unknown, label: string, max = 240) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new ApiError(`${label} 입력을 확인하세요.`);
  return value.trim();
}
export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
