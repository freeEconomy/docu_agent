export type DocumentStatus = 'ready' | 'processing' | 'failed';
export type KnowledgeDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  pages: number;
  category: string;
  owner: string;
  date: string;
  status: DocumentStatus;
  text: string;
  uploaded?: boolean;
};
export const budgetText =
  '본 계획서 승인 즉시 착수 예정인 3분기 클라우드 네이티브 전환 사업비는 총 1억 2,000만 원으로 책정되었으며, 세부 항목으로는 쿠버네티스 컨테이너 오케스트레이션 클러스터 라이선스 비용 4,500만 원, 글로벌 멀티리전 DR(재해복구) 스토리지 이중화 구축비 5,200만 원, 그리고 외부 전문 아키텍트 감리 및 보안 인증 평가비 2,300만 원을 포함한다. 해당 예산은 경영위원회 결의 제 2024-19호에 의거한 예비비 전용 조항을 통해 즉각 집행 가능하다.';
export const approvalText =
  '단일 건 기준 3,000만 원을 초과하는 IT 시스템 지출은 소관 본부장 전결 후 경영기획실 사전 합의를 거쳐야 하며, 5,000만 원 이상은 대표이사 결재 항목으로 분류한다.';
export const seedDocuments: KnowledgeDocument[] = [
  {
    id: 'DOC-8942',
    name: '2024_경영계획서_Q3.pdf',
    type: 'PDF',
    size: 14.2,
    chunks: 64,
    pages: 64,
    category: '경영기획',
    owner: '이서연 수석',
    date: '2024.10.15',
    status: 'ready',
    text: budgetText,
  },
  {
    id: 'DOC-7719',
    name: '사내_전결규정_2024.pdf',
    type: 'PDF',
    size: 2.8,
    chunks: 16,
    pages: 16,
    category: '인사총무',
    owner: '김민준 팀장',
    date: '2024.10.12',
    status: 'ready',
    text: approvalText,
  },
  {
    id: 'DOC-6204',
    name: '클라우드_인프라_아키텍처_v2.4.docx',
    type: 'DOCX',
    size: 6.5,
    chunks: 48,
    pages: 32,
    category: '기술개발',
    owner: '박진우 책임',
    date: '2024.10.10',
    status: 'ready',
    text: '클라우드 인프라는 Kubernetes 기반 컨테이너 환경으로 구성합니다. 멀티 리전 DR 구성 및 접근 권한 분리를 적용합니다.',
  },
  {
    id: 'DOC-1029',
    name: '2024_신임직원_온보딩_가이드.pdf',
    type: 'PDF',
    size: 8.4,
    chunks: 28,
    pages: 38,
    category: '교육운영',
    owner: '이서연 수석',
    date: '2024.10.15',
    status: 'processing',
    text: '신규 입사자는 첫 주에 보안 교육을 이수하고 업무 계정과 개발 환경을 설정합니다.',
  },
  {
    id: 'DOC-0418',
    name: '구형_스캔문서_암호화본.pdf',
    type: 'PDF',
    size: 21,
    chunks: 0,
    pages: 1,
    category: '보안필독',
    owner: '최유리 책임',
    date: '2024.10.08',
    status: 'failed',
    text: 'DRM 보호 문서입니다. 암호화 해제된 원본으로 다시 등록해 주세요.',
  },
  {
    id: 'DOC-3810',
    name: '정보보안_가이드라인.md',
    type: 'MD',
    size: 0.4,
    chunks: 24,
    pages: 8,
    category: '정보보안',
    owner: '최유리 책임',
    date: '2024.10.07',
    status: 'ready',
    text: '외부 협력사의 접근 권한은 담당 부서 승인 후 부여하며 프로젝트 종료 시 즉시 회수합니다. 최소 권한 원칙과 다중 요소 인증을 적용합니다.',
  },
  {
    id: 'DOC-3811',
    name: 'Core_API_기술명세서.txt',
    type: 'TXT',
    size: 0.2,
    chunks: 12,
    pages: 6,
    category: '기술개발',
    owner: '박진우 책임',
    date: '2024.10.06',
    status: 'ready',
    text: 'API 요청은 인증 헤더를 포함해야 합니다. 요청 제한은 분당 100회이며 오류 응답은 표준 JSON 형식을 사용합니다.',
  },
];
export function validateFile(file: Pick<File, 'name' | 'size'>): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'docx', 'hwpx', 'txt', 'md', 'markdown'].includes(ext))
    return `${file.name}: 지원하지 않는 파일 형식입니다.`;
  if (file.size > 50 * 1024 * 1024) return `${file.name}: 파일당 최대 50MB까지 등록할 수 있습니다.`;
  if (!file.size) return `${file.name}: 빈 파일은 등록할 수 없습니다.`;
  return null;
}
export function mockAnswer(question: string, documents: KnowledgeDocument[]) {
  const ready = documents.filter((d) => d.status === 'ready');
  if (!ready.length)
    return '선택한 문서에 준비된 문서가 없습니다. 문서를 등록하거나 컨텍스트를 변경해 주세요.';
  const match =
    ready.find((d) =>
      question.includes('보안')
        ? d.category === '정보보안'
        : question.includes('승인') || question.includes('전결')
          ? d.id === 'DOC-7719'
          : d.id === 'DOC-8942',
    ) ?? ready[0];
  return `“${question}”에 대한 데모 답변입니다.\n\n${match.text}\n\n출처: ${match.name}\n\n이 응답은 Mock 데이터로 생성되었습니다. 실제 파일 분석이나 RAG 검색을 수행하지 않습니다.`;
}
