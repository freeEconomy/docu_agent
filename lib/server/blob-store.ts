import { get, head, del, BlobNotFoundError } from '@vercel/blob';
import { ApiError } from './http';
export function requireBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new ApiError(
      '비공개 Blob 저장소가 아직 연결되지 않았습니다. BLOB_READ_WRITE_TOKEN을 등록하세요.',
      503,
    );
}
export async function blobMetadata(pathname: string) {
  requireBlob();
  try {
    return await head(pathname);
  } catch (error) {
    if (error instanceof BlobNotFoundError)
      throw new ApiError(
        '업로드 원본을 찾을 수 없습니다. 업로드를 완료하거나 다시 시도하세요.',
        409,
      );
    throw error;
  }
}
export async function readOriginal(pathname: string) {
  requireBlob();
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200)
    throw new ApiError('원본 파일을 찾을 수 없습니다.', 404);
  return result;
}
export async function removeOriginal(pathname: string) {
  requireBlob();
  try {
    await del(pathname);
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) throw error;
  }
}
