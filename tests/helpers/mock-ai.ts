// Deterministic provider fixture for isolated tests; never used by the app.
export function mockEmbedding(text: string) {
  const v = Array(512).fill(0);
  v[/계정|보안|권한|접근|협력|종료/.test(text) ? 0 : /육아|단축|자녀/.test(text) ? 1 : 2] = 1;
  return v;
}
export function mockAnswer(body: any) {
  const input = JSON.parse(body.contents[0].parts[0].text);
  const quote = input.excerpts[0].text.slice(0, 100);
  return {
    candidates: [
      {
        finishReason: 'STOP',
        content: {
          parts: [
            {
              text: JSON.stringify({
                supported: true,
                answer: '문서에 명시된 기준을 따라 처리해야 합니다. [1]',
                sources: [{ source: 1, quote }],
              }),
            },
          ],
        },
      },
    ],
  };
}
