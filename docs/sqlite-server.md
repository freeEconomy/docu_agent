> 이전 버전 참고 문서입니다. 현재 앱 설정은 [Neon + Private Blob 안내](neon-blob-setup.md)를 사용하세요.

# SQLite 서버 실행과 운영

DocuMind는 프로젝트 내부 파일을 영구 저장소로 사용합니다. Supabase 키·접속·SQL Editor 설정은 필요하지 않습니다. Node.js **22.13 이상**의 내장 SQLite와 FTS5를 사용합니다. Docker는 Node 22 최신 패치 버전을 사용합니다.

## 기본 저장 위치

```text
프로젝트/
└── data/
    ├── documind.sqlite       # 계정, 세션, 문서 정보, 추출 텍스트, 청크, 대화
    ├── documind.sqlite-wal   # 실행 중 SQLite가 관리하는 변경 로그
    ├── documind.sqlite-shm   # 실행 중 SQLite가 관리하는 공유 메모리 파일
    └── uploads/
        └── 문서UUID         # 실제 원본 바이너리, 이름은 DB에 별도 저장
```

첫 API 요청 시 DB와 테이블을 자동 생성합니다. 최초 계정·문서·대화는 없습니다. 회원가입 후 바로 로그인되며 확인 이메일을 보내지 않습니다. 같은 회사 이름으로 가입해도 문서는 공유되지 않습니다. 기존 Supabase 데이터와 계정은 수정하거나 삭제하지 않으며 자동 이전하지 않습니다. 새 로컬 계정을 만들어 사용하세요.

파일은 `public/` 밖에 두고 인증된 API로만 내려줍니다. 서버는 세션과 문서 소유자를 매 요청 확인합니다. `data/`, SQLite/WAL/SHM, 백업, 비밀 환경 파일은 Git과 Docker 빌드 컨텍스트에서 제외합니다. DB를 웹소스와 함께 GitHub에 올려서 동기화하지 마세요.

## Node.js 서버 실행

```bash
npm ci
npm run build
npm start
```

첫 실행 후 회원가입 → 문서 업로드 → 분석 완료 → 질문 순서로 사용합니다. 기본 포트는 3000입니다. `npm run dev`는 개발용입니다.

별도 영구 디스크를 쓰는 운영 서버에서는 다음 환경 변수를 프로세스 관리자에 설정하세요.

```text
DOCUMIND_DATA_DIR=/srv/documind-data
APP_ORIGIN=https://documind.example.com
```

`DOCUMIND_DATA_DIR` 아래에 DB와 `uploads/`가 함께 저장됩니다. 서버 실행 계정이 해당 폴더에 쓰기 권한을 가져야 합니다. 기본 파일/폴더 권한은 600/700입니다. `APP_ORIGIN`에는 실제 브라우저 접속 URL의 origin(경로 없이 scheme+host+port)을 지정합니다. 리버스 프록시 뒤에서는 이 값을 반드시 지정해야 정상적인 요청과 Secure 쿠키를 처리할 수 있습니다.

하나의 Node.js 서버 프로세스와 로컬 영구 디스크를 기준으로 합니다. SQLite WAL과 busy_timeout으로 동일 서버의 동시 쓰기를 처리합니다. 여러 서버 인스턴스가 NFS의 같은 SQLite 파일을 공유하도록 구성하지 마세요.

## Docker로 실행

```bash
docker compose up -d --build
```

기본 Compose는 호스트의 `127.0.0.1:3000`에만 바인딩합니다. 같은 서버에서는 브라우저에서 **localhost**의 3000 포트로 접속합니다. 공개 운영은 앞에 HTTPS 리버스 프록시를 두고 `.env` 또는 서버 환경에 `APP_ORIGIN=https://실제도메인`을 지정하세요. `APP_ORIGIN` 기본값이 localhost이므로 127.0.0.1이나 다른 도메인으로 접근할 때에는 일치하는 값으로 변경해야 합니다.

컨테이너 `/app/data`는 Docker 영구 볼륨 `documind-data`에 연결됩니다. 재빌드·재시작·컨테이너 교체 후에도 데이터는 남습니다. `docker compose down -v`는 볼륨까지 삭제하므로 데이터 보존이 필요할 때 실행하지 마세요.

```bash
docker compose logs --tail=100 documind
docker compose restart documind
```

## HTTPS 리버스 프록시 예시

도메인과 TLS 인증서는 실제 서버에 맞게 설정합니다. Nginx에서 `/` 전체를 Node 앱으로 전달하고 업로드 크기와 분석 시간을 허용하세요.

```nginx
location / {
    client_max_body_size 21m;
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90s;
}
```

`/data/`나 `/uploads/`를 정적 경로로 노출하지 않습니다. Next 앱의 `/api/documents/:id/original`을 통해서만 원본에 접근합니다.

## 백업과 복원

원본 폴더와 DB가 같은 시점이어야 하므로 **백업 중 서버를 정지**합니다. SQLite 파일 하나만 실행 중 복사하면 WAL의 최신 변경이나 원본을 누락할 수 있습니다.

Node.js로 실행한 경우 프로세스 관리자로 앱을 정지한 뒤 전체 데이터 디렉터리를 다른 디스크에 복사합니다. 기본 경로 예시:

```bash
mkdir -p backups
cp -a data "backups/data-$(date +%Y%m%d-%H%M%S)"
```

복원 시에도 앱을 정지하고 현재 데이터 디렉터리를 별도 보관한 뒤 백업의 전체 내용을 복원합니다. 파일 소유자는 서버 실행 계정과 같게 유지하세요.

Docker 예시:

```bash
docker compose stop documind
mkdir -p backups
docker compose cp documind:/app/data "backups/data-$(date +%Y%m%d-%H%M%S)"
docker compose start documind
```

백업에는 원본 문서·대화·계정 정보가 포함됩니다. 비공개 저장소에 보관하세요. 원본과 SQLite 사이에 분산 트랜잭션은 없으므로 디스크 오류나 업로드 중 강제 종료 시 DB와 파일 상태를 점검해야 합니다. 문서 삭제는 원본 삭제 후 DB를 지우며 중단된 삭제는 같은 문서의 삭제를 다시 실행할 수 있습니다. 과거 대화의 인용 스냅샷은 문서 삭제 후에도 대화에 남습니다.

## 인증과 비밀번호

비밀번호는 랜덤 salt를 사용한 scrypt 해시로 저장하고, 로그인 토큰은 HttpOnly·SameSite=Lax 쿠키로 전달합니다. DB에는 토큰 원문 대신 SHA-256 해시와 만료 시간을 보관합니다. 로그인/비밀번호 변경 시도는 계정별 15분 창으로 제한하고, 교차 사이트 변경 요청은 거부합니다.

로그인한 뒤 설정 → 비밀번호 변경에서 현재 비밀번호를 입력해 변경합니다. 다른 세션은 폐기됩니다. 이메일 발송 서비스가 없으므로 이메일 확인·비밀번호 재설정 메일·SSO는 지원하지 않습니다. 부서별 관리자 역할이나 기업 멤버 공유도 별도 구현 범위입니다. 현재 회원가입은 공개되어 있으므로 사내 전용으로 운영하려면 리버스 프록시에서 접근할 사용자를 제한할 수 있습니다.

## 문서 처리와 AI

- PDF/DOCX/HWPX/TXT/Markdown, 파일당 20MB. TXT/Markdown은 UTF-8.
- PDF 최대 300페이지, 추출 텍스트 최대 40만 자. 스캔 PDF의 OCR과 암호 해제는 제공하지 않습니다.
- 청크는 1,200자와 180자 중첩. SQLite FTS5와 한글 부분 일치로 최대 6개 근거를 검색합니다.
- 기본은 실제 원문 발췌 모드입니다. AI 생성은 서버 전용 `RAG_API_KEY`에 OpenAI 키를 설정한 뒤 앱을 재시작하면 활성화됩니다. `RAG_MODEL` 기본값은 `gpt-4o-mini`입니다. 질문과 선택된 원문이 OpenAI로 전송됩니다.
- 관련 근거가 없으면 임의 문서를 인용하거나 AI를 호출하지 않습니다. 대화는 저장/복원되지만 검색은 현재 질문을 기준으로 합니다.
- 분석은 요청 안에서 실행합니다. 중단된 분석은 5분 후 재분석할 수 있습니다. 별도 작업 큐는 없습니다.

## Vercel과 기존 Supabase

이 버전은 영구 디스크가 있는 서버용입니다. Vercel 파일시스템에 데이터를 쓰도록 우회하지 않습니다. Vercel 실행 환경에서는 저장 API가 명확한 오류를 반환합니다. `vercel.json`의 `ignoreCommand: "exit 0"`으로 새 Git 배포를 건너뛰어 기존 배포를 SQLite 미지원 버전으로 교체하지 않도록 했습니다. 새 서버 주소를 실제 사용자에게 제공해야 합니다.

저장소의 `supabase/migrations/`는 이전 버전의 기록입니다. 현재 앱에서는 실행하거나 참조하지 않습니다. 기존 Supabase 프로젝트를 제거하거나 기존 데이터를 삭제하지 않습니다.
