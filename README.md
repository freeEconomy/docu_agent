# DocuMind — 문서 기반 AI 워크스페이스

Google Stitch 디자인을 기반으로 만든 Next.js App Router + React + TypeScript + Tailwind 앱입니다. Supabase Auth·Postgres·비공개 Storage를 사용합니다. 초기 문서·대화·통계는 비어 있고 업로드한 실제 문서만 검색합니다.

## 최초 설정

[Supabase 설치 안내](docs/supabase-setup.md)를 따라 [마이그레이션 SQL](supabase/migrations/202610180001_documind.sql)을 프로젝트 SQL Editor에서 **한 번** 실행하세요. 제공받은 공개 URL/key는 연결되어 있습니다. SQL 실행 없이 앱만 배포하면 테이블 설치 안내가 표시됩니다. 이메일 확인과 비밀번호 재설정을 위해 Supabase Auth에 배포 URL도 등록해야 합니다.

AI 키가 없으면 실제 문서 청크를 검색해 원문 발췌를 반환합니다. 서버에 `RAG_API_KEY`를 설정하면 OpenAI가 검색된 근거로 답변을 생성합니다. 현재 검색은 FTS·한글 부분 일치·trigram이며 임베딩 벡터 검색은 사용하지 않습니다.

## 실행 및 검증

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev
npm run typecheck
npm run test:backend
npm run build
npm start
npm run format:check
```

제한된 환경의 npm 캐시는 `npm ci --cache /workspace/.npm-cache`를 사용하세요.

```bash
npx playwright install --with-deps chromium
npm test
# 시스템 Chromium을 사용한다면:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
python3 -m unittest discover -s tests -p 'test_stitch_*.py'
```

백엔드 테스트는 실제 파일 파서 및 PostgreSQL(PGlite)에서 마이그레이션·사용자 간 격리·Storage 정책·청크 교체·한글 검색을 검증합니다. 브라우저 테스트는 외부 서비스 경계 응답을 대체하여 빈 상태·로그인·업로드/상세/수정/삭제·대화 복원·모바일을 검사합니다. 운영 Supabase 통합 검증과 구별합니다.

## 구현 화면

| 경로                | 기능                                                       |
| ------------------- | ---------------------------------------------------------- |
| `/login`, `/signup` | Supabase 이메일·비밀번호 인증, 가입 확인 이메일 처리       |
| `/reset-password`   | 이메일 링크를 통한 비밀번호 변경                           |
| `/chat`             | 실제 검색 API, 원문 발췌/AI 생성, 인용, 저장된 대화 복원   |
| `/documents`        | 실제 파일 업로드, 분석 상태, 검색·필터, 재분석, 수정·삭제  |
| `/documents/[id]`   | 비공개 원본 다운로드/PDF 미리보기, 실제 추출 텍스트와 청크 |
| `/admin`            | 본인 계정의 문서·청크·질문 통계                            |
| `/settings`         | DB 연결 상태 및 설치 안내                                  |

사용자마다 데이터가 분리됩니다. 같은 회사 이름으로 가입해도 공유 권한이 생기지 않습니다. SSO·기업 멤버 공유·전사 관리자 역할·OCR·벡터 검색은 아직 제공하지 않습니다.

## 구조

```text
app/api/chat/route.ts                   인증·검색·선택적 생성·대화 저장
app/api/documents/[id]/process/route.ts  원본 읽기·파싱·원자적 인덱싱
components/workspace-provider.tsx       Auth 세션과 Supabase 문서 CRUD
lib/supabase/                          공개 설정·타입·브라우저/서버 클라이언트
lib/ingestion.ts                       PDF/DOCX/HWPX/TXT/Markdown 추출·청크화
supabase/migrations/                   테이블·RPC·RLS·비공개 Storage 정책
docs/supabase-setup.md                 실행 SQL·인증·Vercel 설정·검증 절차
```

Stitch의 캔버스 `#faf8ff`, 표면 `#f2f3ff`, 주요 버튼 `#004ac6`, 채팅 강조 `#2563eb` 및 사이드바·스플릿 뷰·반응형 내비게이션을 유지합니다. Inter/Noto Sans KR은 자체 호스팅합니다. 기존 브라우저 목업 저장소는 읽거나 자동 업로드하지 않습니다.

## Vercel 배포

Framework: **Next.js**, Root Directory: 저장소 루트, Node.js **22.x**, Install: `npm ci`, Build: `npm run build`. `vercel.json`의 outputDirectory는 `.next`입니다. `public`으로 지정하지 마세요.

Git 연동으로 main 푸시는 운영 배포, 별도 브랜치는 Preview 배포를 생성합니다. 공개 Supabase 값 변경 시 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정하고 다시 빌드하세요. 선택적 `RAG_API_KEY`와 `RAG_MODEL`은 서버 전용입니다. 앱은 service role 키를 사용하지 않습니다. 상세한 인증 URL·초기 SQL 설정은 위 설치 안내를 참고하세요.

## Stitch 연결

ZIP 없이 디자인을 조회하는 MCP 설정 및 인증 절차는 [Stitch 연결 가이드](docs/stitch-connection.md)를 참고하세요. `.codex/config.toml`은 `STITCH_API_KEY`를 참조하며 실제 키 값은 포함하지 않습니다. 현재 실행 중인 웹 대화의 도구 목록은 이 파일만으로 변경되지 않습니다.

인증 후 `python3 scripts/stitch-sync.py`로 DocuMind의 최신 HTML·PNG 6개 화면을 기존 `design/` 폴더로 직접 가져올 수 있습니다. 프로젝트/화면 연결은 `.stitch/project.json`에 저장되어 있습니다. `--check`는 파일을 쓰지 않고 차이만 검사합니다. 가져온 변경은 Git 브랜치·PR로 검토하며, 자동 실시간 푸시나 앱 UI 자동 변환은 수행하지 않습니다.
