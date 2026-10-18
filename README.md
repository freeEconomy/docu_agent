# DocuMind — SQLite 문서 에이전트

Next.js App Router + React + TypeScript + Tailwind 앱입니다. **프로젝트 내부 SQLite 파일과 비공개 원본 폴더**에 계정·문서·청크·대화를 저장합니다. Supabase 없이 동작하며 처음에는 모든 사용자 문서와 대화가 비어 있습니다.

```text
data/documind.sqlite   # 실제 DB
data/uploads/         # 실제 업로드 원본
```

첫 요청 시 테이블을 자동 생성합니다. 회원가입 → 문서 업로드 → 실제 텍스트 추출 → 질문 → 근거 및 원본 확인 순서로 사용할 수 있습니다. 재시작 후에도 데이터가 유지됩니다. 비밀번호는 scrypt 해시로, 세션은 HttpOnly 쿠키와 DB의 토큰 해시로 관리하고 사용자별 문서를 분리합니다.

## 실행

Node.js **22.13 이상**이 필요합니다.

```bash
npm ci
npm run build
npm start
```

개발은 `npm run dev`, Docker는 `docker compose up -d --build`입니다. Docker 기본 포트는 호스트의 127.0.0.1:3000이며 localhost로 접속합니다. 공개 도메인에는 HTTPS 프록시와 `APP_ORIGIN` 설정이 필요합니다. 설치·영구 볼륨·백업·복원은 [서버 운영 안내](docs/sqlite-server.md)를 참고하세요.

환경 변수:

| 이름                | 용도                                        |
| ------------------- | ------------------------------------------- |
| `DOCUMIND_DATA_DIR` | 저장 경로, 기본 프로젝트의 `data/`          |
| `APP_ORIGIN`        | HTTPS 배포 URL origin, 프록시 뒤에서는 필수 |
| `RAG_API_KEY`       | 선택적 서버 전용 OpenAI 키                  |
| `RAG_MODEL`         | 기본 `gpt-4o-mini`                          |

AI 키가 없으면 SQLite FTS5·한글 부분 일치로 검색한 **실제 원문 발췌**를 반환합니다. 키가 있으면 같은 근거로 AI가 답변을 생성합니다. 임베딩 벡터 검색이나 OCR은 사용하지 않습니다.

## 검증

```bash
npm run typecheck
npm run test:backend
npm run build
npx playwright install --with-deps chromium
npm test
npm run format:check
python3 -m unittest discover -s tests -p 'test_stitch_*.py'
```

시스템 Chromium은 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`로 사용할 수 있습니다. 제한된 환경의 npm 캐시는 `npm ci --cache /workspace/.npm-cache`를 사용하세요.

백엔드 테스트는 실제 SQLite와 파일 저장·재시작·접근 분리·청크 검색·파서를 검사합니다. 브라우저도 모킹 없이 실제 로컬 인증·업로드·분석·대화·삭제 API를 사용합니다. 테스트마다 임시 저장 디렉터리를 만들어 사용자 운영 DB를 건드리지 않습니다. 외부 OpenAI 응답 검증은 포함하지 않습니다.

## 화면과 구조

기존 Stitch의 색상·사이드바·스플릿 뷰·반응형 레이아웃을 유지합니다. `/login`, `/signup`, `/chat`, `/documents`, `/documents/[id]`, `/admin`, `/settings`, `/reset-password`를 제공합니다. `/admin`은 본인 계정의 실제 사용 통계이고 `/reset-password`는 로그인 후 현재 비밀번호를 확인하는 변경 화면입니다. 이메일 재설정과 SSO는 제공하지 않습니다.

```text
app/api/[...path]/route.ts    자체 인증·문서·원본·검색·대화 API
lib/server/db.ts             SQLite DDL·WAL·트랜잭션
lib/server/auth.ts           비밀번호 해시·세션·접근 확인
lib/server/documents.ts      실제 원본 파일 및 파싱
lib/server/repository.ts     사용자별 쿼리·FTS5·청크·대화 저장
lib/ingestion.ts             PDF/DOCX/HWPX/TXT/Markdown 추출
components/                 기존 디자인 기반 UI
Dockerfile / compose.yaml   서버 컨테이너 및 영구 볼륨
```

## 배포 및 데이터 보존

**Vercel 대신 영구 디스크가 있는 Node.js 서버에서 실행**합니다. Vercel 자동 배포는 `ignoreCommand`로 건너뜁니다. 저장소에 코드를 푸시해도 로컬 DB나 원본 파일은 Git에 올라가지 않습니다. 서버 데이터 전체를 별도로 백업하세요. 기존 Supabase 프로젝트와 데이터는 그대로 두며 현재 앱과 연결하지 않습니다.

## Stitch 연결

ZIP 없이 디자인을 조회하는 MCP 설정 및 인증 절차는 [Stitch 연결 가이드](docs/stitch-connection.md)를 참고하세요. `.codex/config.toml`은 `STITCH_API_KEY`를 참조하며 실제 키 값은 포함하지 않습니다. 현재 실행 중인 웹 대화의 도구 목록은 이 파일만으로 변경되지 않습니다.

인증 후 `python3 scripts/stitch-sync.py`로 DocuMind의 최신 HTML·PNG 6개 화면을 기존 `design/` 폴더로 직접 가져올 수 있습니다. 프로젝트/화면 연결은 `.stitch/project.json`에 저장되어 있습니다. `--check`는 파일을 쓰지 않고 차이만 검사합니다. 가져온 변경은 Git 브랜치·PR로 검토하며, 자동 실시간 푸시나 앱 UI 자동 변환은 수행하지 않습니다.
