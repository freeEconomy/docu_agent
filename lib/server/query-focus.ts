// Extract the requested topic without asking another model. The complete
// question is still sent to the answer model and used for vector retrieval.
export function queryFocus(question: string): string {
  const focus = question
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(
      /(?:에\s*(?:대해서|대해|관해서|관해))?\s*(?:알려\s*줘(?:요)?|알려\s*주세요|설명해\s*줘(?:요)?|설명해\s*주세요|정리해\s*줘(?:요)?|정리해\s*주세요|요약해\s*줘(?:요)?|요약해\s*주세요)[.!?？\s]*$/u,
      '',
    )
    .replace(/[.!?？\s]+$/u, '')
    .trim()
    .replace(/(?:을|를|은|는)$/u, '')
    .replace(/\s+/g, '');
  return focus.length >= 4 && focus.length <= 60 ? focus : '';
}
