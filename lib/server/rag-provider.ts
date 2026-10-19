import { ApiError } from './http';
// Both models have a Gemini Developer API free tier. Billing tier is a Google
// project setting: the application cannot infer or enforce it from an API key.
export const embeddingModel = 'gemini-embedding-2';
export const embeddingDimensions = 512;
export const embeddingVersion = `gemini:${embeddingModel}:${embeddingDimensions}`;
export const answerModel = () => 'gemini-2.5-flash-lite';
export const aiConfigured = () => !!process.env.GEMINI_API_KEY;
export function requireAI() {
  if (!aiConfigured())
    throw new ApiError(
      'AI 답변 설정이 아직 완료되지 않았습니다. 관리자에게 Gemini API 연결을 요청하세요.',
      503,
    );
}
export async function gemini(
  model: string,
  method: 'batchEmbedContents' | 'generateContent',
  body: unknown,
) {
  requireAI();
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
        redirect: 'error',
      },
    );
  } catch {
    throw new ApiError('Gemini에 연결하지 못했습니다. 잠시 후 다시 시도하세요.', 502);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ApiError(
        'Gemini 제공자의 사용 한도에 도달했습니다. 잠시 후 또는 다음 할당량 갱신 후 이용하세요.',
        429,
      );
    if ([400, 401, 403, 404].includes(response.status))
      throw new ApiError('Gemini API 키·모델 접근 권한·프로젝트 설정을 확인하세요.', 503);
    throw new ApiError('Gemini 요청에 실패했습니다. 잠시 후 다시 시도하세요.', 502);
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError('Gemini 응답을 읽지 못했습니다.', 502);
  }
}
export async function createEmbeddings(texts: string[]) {
  const result = await gemini(embeddingModel, 'batchEmbedContents', {
    requests: texts.map((text) => ({
      model: `models/${embeddingModel}`,
      content: { parts: [{ text }] },
      outputDimensionality: embeddingDimensions,
    })),
  });
  if (!Array.isArray(result.embeddings) || result.embeddings.length !== texts.length)
    throw new ApiError('임베딩 응답 개수가 일치하지 않습니다.', 502);
  return result.embeddings.map((e: { values: unknown }, index: number) => ({
    index,
    embedding: e.values,
  }));
}
