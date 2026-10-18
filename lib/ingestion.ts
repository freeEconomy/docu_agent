import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
export const maxTextCharacters = 400_000;
export function chunkText(text: string, size = 1200, overlap = 180): string[] {
  const normalized = text
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!normalized) throw new Error('추출할 텍스트가 없습니다. 스캔 PDF는 OCR 후 업로드하세요.');
  if (normalized.length > maxTextCharacters)
    throw new Error('텍스트가 40만 자를 초과합니다. 문서를 나누어 업로드하세요.');
  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += size - overlap) {
    chunks.push(normalized.slice(start, start + size));
    if (start + size >= normalized.length) break;
  }
  return chunks;
}
function checkedArchive(bytes: Uint8Array, hwpx: boolean) {
  let total = 0;
  return unzipSync(bytes, {
    filter: (entry) => {
      total += entry.originalSize;
      if (entry.originalSize > 25_000_000 || total > 60_000_000)
        throw new Error('압축 해제 용량이 제한을 초과합니다.');
      return hwpx && /^Contents\/section\d+\.xml$/.test(entry.name);
    },
  });
}
export async function parseDocument(
  bytes: Uint8Array,
  extension: string,
): Promise<{ text: string; pages: number }> {
  switch (extension.toLowerCase()) {
    case 'txt':
    case 'md':
    case 'markdown':
      return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), pages: 0 };
    case 'pdf': {
      if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith('%PDF-'))
        throw new Error('올바른 PDF 파일이 아닙니다.');
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      try {
        if (pdf.numPages > 300) throw new Error('PDF는 300페이지 이하로 나누어 업로드하세요.');
        const result = await extractText(pdf, { mergePages: true });
        return { text: result.text, pages: result.totalPages };
      } finally {
        await pdf.cleanup();
      }
    }
    case 'docx': {
      checkedArchive(bytes, false);
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return { text: result.value, pages: 0 };
    }
    case 'hwpx': {
      const files = checkedArchive(bytes, true);
      const parser = new XMLParser({
        ignoreAttributes: true,
        removeNSPrefix: true,
        processEntities: false,
        parseTagValue: false,
      });
      const sections = Object.entries(files).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      if (!sections.length) throw new Error('HWPX 본문을 찾지 못했습니다.');
      function collect(value: unknown, insideText = false): string[] {
        if (typeof value === 'string') return insideText ? [value] : [];
        if (Array.isArray(value)) return value.flatMap((v) => collect(v, insideText));
        if (value && typeof value === 'object')
          return Object.entries(value).flatMap(([key, v]) => collect(v, insideText || key === 't'));
        return [];
      }
      return {
        text: sections
          .map(([, data]) => collect(parser.parse(strFromU8(data))).join('\n'))
          .join('\n\n'),
        pages: 0,
      };
    }
    default:
      throw new Error('지원하지 않는 파일 형식입니다.');
  }
}
