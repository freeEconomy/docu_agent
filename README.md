# DocuMind — 문서 RAG 에이전트 프론트엔드

Google Stitch의 `design/stitch_documind_ai_agent_platform` 화면을 Next.js App Router, React, TypeScript, Tailwind CSS로 구현한 실행 가능한 프론트엔드입니다. 실제 RAG, Supabase 인증·DB·Storage는 다음 단계에서 연결합니다.

## 로컬 실행

Node.js 22 이상과 npm이 필요합니다. 현재 버전은 lockfile로 고정합니다.

```bash
npm ci
npm run dev
```

개발 서버 기본 포트는 3000입니다. 환경 변수나 외부 서비스 없이 실행할 수 있습니다. 제한된 클라우드 환경에서 기본 npm 캐시 디렉터리에 쓸 수 없다면 `npm ci --cache /workspace/.npm-cache`를 사용하세요.

```bash
npm run build           # 프로덕션 빌드 + TypeScript 검사
npm start               # 빌드한 앱 실행
npm run typecheck       # 별도 TypeScript 검사
npm run format:check
```

## 구현 화면

| 경로              | Stitch 원본        | 구현 내용                                                                                                                            |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/chat`           | `ai`               | 질문 전송, Mock 응답, 컨텍스트 문서 선택, 근거 패널, 출처 이동, 복사·내보내기, 새 대화                                               |
| `/documents`      | `_1`               | 다중 파일·드래그 업로드, 형식/50MB/빈 파일 검사, 모의 처리 상태, 검색·필터·페이지 이동, 일괄 재분석·카테고리 변경·삭제, CSV 내보내기 |
| `/documents/[id]` | `_2`               | 발췌 원문/청크 분석, 페이지·배율 제어, 검색, 메타데이터 수정, JSON 메타데이터, 처리 이력, 텍스트 복사                                |
| `/login`          | `_4`               | 이메일 입력 검증, 비밀번호 표시 전환, Mock 로그인, 데모 입장, SSO 미연동 안내                                                        |
| `/signup`         | `_3`               | 3단계 모의 가입, 비밀번호 확인 검증, 워크스페이스·기본 권한 입력                                                                     |
| `/admin`          | `rag`              | 지표 카드, 기간 변경, SVG 트래픽 차트, 문서 분포, 인기 문서, 이벤트 필터, CSV 리포트, 모의 스케줄                                    |
| `/settings`       | 디자인 시스템 확장 | 로컬 설정 저장, 추후 서비스 연동 상태                                                                                                |

`/`는 `/chat`으로 이동합니다. 로그인은 화면 시연용이며 라우트 접근을 제한하지 않습니다. 관리자 화면 또한 실제 권한 검사가 없습니다.

## 디자인 적용

- 원본 HTML, PNG 6개 및 `executive_precision_rag/DESIGN.md`를 분석했습니다. 원본 디자인 파일은 수정하지 않았습니다.
- 캔버스 `#faf8ff`, 보조 표면 `#f2f3ff`, 주요 버튼 `#004ac6`, 채팅 강조 `#2563eb`, 청크/근거 패널의 라벤더 톤을 유지합니다.
- 데스크톱 사이드바 260–288px, 넓은 화면의 3열 채팅, 좁은 화면의 근거 오버레이, 모바일 문서 원본/청크 탭과 접이식 내비게이션을 적용합니다.
- Inter / Noto Sans KR을 npm 패키지에서 자체 호스팅합니다. 아이콘은 Lucide SVG이며, 런타임 Google CDN이나 원본 외부 아바타 이미지에 의존하지 않습니다.
- 수치는 실제 로컬 문서 목록과 일치시키거나 Mock으로 표시합니다. 실제 기능이 아닌 보안·SSO·RAG 상태에는 데모/연동 예정 안내를 제공합니다.

## 데이터와 미리보기의 범위

- 문서 메타데이터와 텍스트 발췌는 `localStorage`의 `documind-documents-v1`에 저장됩니다. 업로드 파일은 서버로 전송하지 않습니다. TXT/MD는 최대 100,000자까지 로컬로 읽습니다.
- 원본 `File`은 메모리에만 보관합니다. 같은 클라이언트 탐색 세션에서 업로드한 PDF는 브라우저 PDF 뷰어로 열고 원본 다운로드할 수 있습니다. 새로고침 후에는 메타데이터/텍스트 발췌만 남으며, 원본 파일은 다시 선택해야 합니다.
- 저장소에는 실제 PDF 원본이 없어 샘플 문서의 원본 패널은 Stitch에 포함된 발췌를 문서 형태로 재구성합니다. PDF·DOCX·HWPX의 텍스트 파싱, OCR, 임베딩은 수행하지 않습니다.
- 기본 샘플 문서에는 처리 중/실패 예제가 포함됩니다. 재분석은 타이머로 완료 상태를 모의합니다. 원본 DRM이나 인덱스 품질을 실제 검증하지 않습니다.
- 채팅은 선택된 준비 상태 문서의 발췌를 이용한 결정적 Mock 응답입니다. 실제 검색, LLM 호출, 사실 검증을 하지 않습니다. 대화는 현재 화면 메모리에만 유지됩니다.
- 로그인 상태는 데모 표시용 문자열만 저장하고 비밀번호는 저장하지 않습니다. “상태 유지”를 선택하면 localStorage, 선택하지 않으면 sessionStorage를 사용합니다.
- 초기화하려면 브라우저의 이 사이트 저장소를 지우세요. 민감한 실제 문서나 비밀번호 대신 데모 데이터를 사용하세요.

## 구조 및 다음 연동 지점

```text
app/                         App Router 페이지 및 공통 레이아웃
components/app-shell.tsx      내비게이션, 헤더, 모바일 메뉴
components/ui.tsx             버튼 주변 UI, 배지, 파일 아이콘, 모달, 다운로드
components/workspace-provider.tsx  문서 상태, 로컬 저장, 업로드, 알림
components/chat.tsx           대화와 근거 패널
components/documents.tsx      문서 목록과 업로드
components/document-detail.tsx 원문/청크 뷰어
components/dashboard.tsx      관리자 통계와 이벤트
components/auth.tsx           로그인/가입 화면
lib/documents.ts              타입, 초기 데이터, 파일 검사, Mock 응답
```

다음 단계에서 Provider의 로컬 CRUD를 Supabase DB/Storage 리포지터리로 교체하고 로그인에 Supabase Auth, 서버 접근 제어와 RLS를 적용합니다. 채팅의 Mock 응답을 서버 측 RAG API/스트리밍 응답으로 교체합니다. 비밀 API 키는 클라이언트에 넣지 않습니다. 현재 구현은 Supabase 패키지나 키를 요구하지 않습니다.

## 브라우저 테스트

```bash
npx playwright install --with-deps chromium
npm run build
npm test
```

설치된 시스템 Chromium을 사용할 때:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

Playwright가 프로덕션 서버를 자동 시작합니다. 데스크톱 Chromium과 모바일 크기의 Chromium에서 채팅→출처 확인, 파일 업로드→처리→검색→미리보기→새로고침→수정→삭제, 잘못된 형식 차단, 필터·페이지 이동, 로그인·가입, 대시보드 필터·다운로드·스케줄 및 반응형 화면 넘침을 검사합니다. 실제 iOS Safari와 외부 서비스 통합 검증은 포함하지 않습니다. GitHub Actions에서도 빌드와 같은 테스트를 실행하도록 구성했습니다.

## Vercel 배포

1. GitHub 저장소를 Vercel에 가져옵니다.
2. Framework Preset: **Next.js**, Root Directory: 저장소 루트, Node.js: **22.x**.
3. Install Command: `npm ci`, Build Command: `npm run build` (기본값 사용 가능).
4. 환경 변수 없이 배포합니다. PR에는 Vercel Git 연동을 통해 Preview Deployment를 추가할 수 있습니다.

저장소의 `vercel.json`이 프레임워크를 `nextjs`, 출력 디렉터리를 `.next`로 명시합니다. 프로젝트 설정에 남아 있는 `public` 출력 경로 대신 이 설정을 적용합니다. `public`은 정적 에셋 폴더이며 Next.js 빌드 출력 폴더가 아닙니다. 기존 배포를 다시 실행할 때는 이 설정이 포함된 최신 커밋을 선택하세요.

별도 서버나 Docker 없이 Vercel의 Next.js 기본 빌드로 실행하도록 구성했습니다. Vercel 프로젝트 생성·배포 및 실제 Supabase/RAG 연동은 이 구현에 포함되지 않습니다.
