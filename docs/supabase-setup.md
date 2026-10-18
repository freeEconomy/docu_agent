> 이전 버전 참고 문서입니다. 현재 앱 설정은 [Neon + Private Blob 안내](neon-blob-setup.md)를 사용하세요.

> 이전 Supabase 버전의 기록입니다. 현재 앱은 Supabase를 사용하지 않습니다. 새 설정은 [SQLite 서버 운영 안내](sqlite-server.md)를 따르세요. 이 문서의 과거 연결 검사 워크플로는 제거되었습니다.

# DocuMind Supabase 설치

대상 프로젝트: https://supabase.com/dashboard/project/uyckuziyzjqterrsgvhg

## 1. 테이블과 비공개 Storage 만들기

[SQL Editor 열기](https://supabase.com/dashboard/project/uyckuziyzjqterrsgvhg/sql/new) → New query → 저장소의 [마이그레이션 SQL](../supabase/migrations/202610180001_documind.sql) 전체 붙여넣기 → Run.

새 프로젝트에서 **한 번** 실행합니다. 이미 실행한 SQL을 반복 실행하면 테이블 중복 오류가 발생합니다. 전체가 트랜잭션으로 실행되어 중간 실패 시 생성 내용은 롤백됩니다. 다른 앱이 같은 이름의 테이블이나 `documents` 버킷을 사용 중이면 먼저 이름 충돌을 확인하세요.

이 SQL이 만드는 항목:

| 항목                       | 용도                                        |
| -------------------------- | ------------------------------------------- |
| `documents`                | 원본 경로·형식·용량·처리 상태·추출 텍스트   |
| `document_chunks`          | 1,200자 청크, 180자 중첩, 검색 인덱스       |
| `conversations`            | 계정별 대화 목록                            |
| `chat_turns`               | 실제 질문·답변·인용·응답 모드               |
| `documents` Storage bucket | 비공개 원본, 최대 20MB                      |
| 처리·검색 RPC 3개          | 작업 중복 방지, 원자적 청크 교체, 근거 검색 |
| RLS / Storage 정책         | 로그인한 본인 계정의 데이터만 접근          |

샘플 계정·문서·질문을 넣지 않습니다. 가입은 Supabase Auth API로 하고 문서는 앱에서 업로드합니다. `auth.users`에 수동 INSERT하지 마세요. publishable key로 SQL DDL이나 관리자 작업을 실행할 수는 없습니다. service role 키나 DB 비밀번호는 이 앱 실행에 필요하지 않습니다.

## 2. 이메일 인증 설정

Authentication → Providers → Email에서 이메일·비밀번호 가입을 활성화합니다. 이메일 확인을 활성화한 프로젝트에서는 가입 후 확인 메일의 링크를 눌러야 로그인할 수 있습니다. 가입 API가 세션을 반환하지 않으면 앱도 즉시 로그인시키지 않습니다.

Authentication → URL Configuration:

- **Site URL**: 실제 Vercel 운영 URL.
- **Redirect URLs**: 운영 URL의 `/chat`, `/reset-password` 및 개발용 `http://localhost:3000/chat`, `http://localhost:3000/reset-password`.
- Preview에서 가입·비밀번호 재설정을 확인하려면 해당 Preview 도메인의 두 경로도 등록합니다. Vercel 접근 보호가 걸린 Preview는 먼저 접근 권한이 있어야 합니다.

정확한 배포 도메인을 사용하세요. 공급자 기본 메일 발송 한도에 도달하면 Supabase SMTP 설정을 확인합니다. Google/Microsoft/Okta SSO는 아직 구현하지 않았습니다.

## 3. 앱 / Vercel 환경 변수

공개 프로젝트 URL과 publishable key는 제공받은 값이 기본 설정으로 연결되어 있습니다. 다른 프로젝트로 바꾸려면 `.env.example`을 참고해 아래 두 값을 설정하고 **다시 빌드**하세요. 공개 키는 권한 비밀이 아니며 데이터 보호는 Auth와 RLS가 담당합니다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

자연어 AI 생성이 필요하면 Vercel → 프로젝트 → Settings → Environment Variables에 **서버 전용** `RAG_API_KEY`를 OpenAI API 키로 설정하고 재배포하세요. 선택적으로 `RAG_MODEL`을 지정합니다(기본 `gpt-4o-mini`). `NEXT_PUBLIC_` 접두사를 붙이지 말고 저장소·채팅에 비밀 값을 넣지 마세요. OpenAI와의 통신은 서버에서만 수행합니다.

- 키 없음: 업로드 문서에서 실제 검색한 원문과 출처를 반환하는 **원문 발췌** 모드.
- 키 있음: 같은 검색 결과만 AI에 전달하여 **AI 생성** 답변과 인용을 저장.
- 관련 근거 없음: 근거를 찾지 못했다고 답하며 임의 문서를 인용하거나 LLM을 호출하지 않음.

현재 검색은 PostgreSQL FTS + 한글 부분 일치 + trigram 방식입니다. 임베딩 모델이나 벡터 검색을 사용한다고 표시하지 않습니다. 생성 모드에서는 질문과 검색된 발췌가 OpenAI로 전송됩니다. 이전 대화는 저장·복원되지만, 새 질의의 검색/생성에는 현재 질문만 전달하므로 지시 대명사 대신 구체적인 질문을 입력하세요.

## 4. 실제 동작 확인

1. 회원가입 → 확인 메일 → 로그인. 문서와 질문 수가 모두 0인지 확인.
2. UTF-8 TXT/Markdown 또는 텍스트가 포함된 PDF/DOCX/HWPX 업로드.
3. `분석 완료` 상태가 된 뒤 상세에서 실제 추출 텍스트와 청크 확인.
4. 새로고침 후에도 원본·문서가 유지되는지 확인.
5. 문서 안의 고유한 키워드로 질문 → 실제 인용과 원본 링크 확인.
6. 저장된 대화를 다시 선택해 복원되는지 확인.
7. 다른 계정으로 로그인하여 기존 문서·대화가 보이지 않는지 확인.
8. 문서 삭제 후 DB 청크와 Storage 원본이 제거되었는지 확인.

운영 데이터 조회용 SQL(SQL Editor는 관리자 권한으로 실행되어 모든 사용자의 데이터가 보입니다):

```sql
select 'documents' as entity, count(*) from public.documents
union all select 'document_chunks', count(*) from public.document_chunks
union all select 'conversations', count(*) from public.conversations
union all select 'chat_turns', count(*) from public.chat_turns;

select id, name, status, chunk_count, error_message, created_at
from public.documents order by created_at desc limit 20;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('documents','document_chunks','conversations','chat_turns');
```

## 처리 한도와 재시도

- 원본 20MB, PDF 300페이지, 추출 텍스트 40만 자, 최대 500청크. DOCX/HWPX는 압축 해제 크기도 제한합니다. TXT/Markdown은 UTF-8로 저장하세요.
- 스캔 이미지 PDF의 OCR·암호화/DRM 해제는 제공하지 않습니다. 텍스트가 없으면 실패 이유를 표시합니다. DOCX/HWPX의 정확한 페이지 수는 추측하지 않습니다.
- 원본은 브라우저에서 Storage로 직접 업로드하므로 Vercel API 요청 본문에 대용량 파일을 싣지 않습니다. API는 인증된 사용자 토큰으로 원본을 읽고 분석합니다. Vercel에서 60초 실행 시간이 지원되어야 합니다.
- 분석은 해당 요청에서 실행됩니다. 브라우저가 종료되거나 서버가 시간 초과되면 자동 백그라운드 재시도는 없습니다. 문서 목록의 재분석 버튼으로 재시도하며, 중단된 처리 잠금은 5분 후 해제할 수 있습니다.
- PDF 미리보기 URL은 2분 후 만료됩니다. 원본 미리보기 버튼으로 갱신하세요. DOCX/HWPX/TXT는 추출 텍스트를 보여주며 원본은 다운로드할 수 있습니다.
- 원본과 DB 삭제는 서로 다른 서비스 요청입니다. 원본 삭제 성공 후 DB 삭제가 실패하면 목록에 남은 행의 삭제를 다시 시도하세요. 오래된 대화의 인용은 당시 원문 스냅샷이며 문서 삭제 후에도 대화 안에 남습니다.
- 대시보드는 본인 계정 통계입니다. 기업 멤버 공동 지식 베이스와 별도 관리자 권한은 현재 범위에 포함하지 않습니다.

## 현재 검증 범위

클라우드 환경에서 해당 Supabase 도메인 요청은 프록시 CONNECT 403으로 차단되었고, 제공된 publishable key 외에 DB 관리자 인증은 없었습니다. 따라서 이 변경에서 운영 프로젝트 DDL 실행, 실제 가입·업로드, OpenAI 응답은 검증하지 않았습니다.

`npm run test:backend`는 PGlite의 실제 PostgreSQL 엔진에서 동일 마이그레이션과 RLS·RPC를 실행합니다. hosted Auth/Storage의 스키마 계약만 테스트용으로 만들며, 파일 추출은 실제 파서로 검사합니다. Playwright는 외부 Auth/Storage/DB/API 경계 응답을 대체해 UI 흐름을 검사하며 운영 통합 테스트를 의미하지 않습니다.

## Codex 클라우드에서 프록시 403이 발생할 때

`Tunnel connection failed: 403 Forbidden`은 Supabase에 도달하기 전 Codex 네트워크 프록시가 접속을 거절한 결과입니다. 테이블을 다시 만들거나 공개 키를 교체해서 해결할 문제는 아닙니다.

Codex의 해당 환경 설정에서 인터넷 액세스의 허용 도메인에 `uyckuziyzjqterrsgvhg.supabase.co`를 추가하고 저장·게시합니다. 초안에 저장한 값과 실제 실행 환경에 적용된 값은 다릅니다. 실행 중인 작업에 반영되지 않으면 저장한 환경으로 새 작업을 시작하고 `npm run check:supabase`를 실행합니다. 네트워크 시크릿에 API 키를 추가하는 절차와는 별개입니다.

GitHub Actions의 **Supabase connection check → Run workflow**에서도 동일한 읽기 전용 검사를 실행할 수 있습니다. 이 검사는 앱과 동일한 공개 프로젝트 설정을 사용하며 Auth 접근, 테이블·검색 RPC 존재, 비로그인 접근 거부를 확인합니다. 문서나 사용자 계정을 추가하지 않습니다. 로그인한 사용자의 업로드·채팅 검증은 별도로 필요합니다. 테이블 검사에서 예상한 401/403 권한 거부는 사용자별 보안 정책이 적용된 정상 응답입니다.
