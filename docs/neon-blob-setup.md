# Neon PostgreSQL + Vercel Private Blob 설정

코드 변경은 저장소를 생성하거나 유료 서비스를 신청하지 않습니다. 아래 두 저장소를 만든 후 연결해야 회원가입·업로드가 동작합니다. 요금·무료 할당량은 가입 시 제공자 화면에서 확인하세요. 영구 무료나 무제한 보관을 보장하지 않습니다.

## 1. Neon 생성

1. [Neon 콘솔](https://console.neon.tech)에서 프로젝트를 만듭니다. Vercel 함수와 가까운 리전을 선택합니다.
2. DocuMind 전용 데이터베이스와 역할을 사용합니다. `Connect`에서 PostgreSQL 연결 문자열을 복사합니다. PostgreSQL 17 이상을 권장합니다.
3. Vercel 프로젝트 → Settings → Environment Variables에 **`DATABASE_URL`**로 저장합니다. 전체 문자열에는 비밀번호가 있으므로 채팅·소스·스크린샷에 올리지 마세요.
4. 로컬 또는 Codex에서 실행할 때도 별도로 안전하게 환경 변수를 등록합니다. Vercel에 저장한 값이 Codex에 자동으로 전달되지는 않습니다.

## 2. 비공개 Blob 생성

1. [Vercel 대시보드](https://vercel.com/dashboard) → Storage → Create Database/Store → Blob에서 저장소를 생성합니다.
2. 접근 권한을 **Private**로 선택합니다. Public 저장소는 원본 문서용으로 사용하지 않으며 앱이 완료 확인 단계에서 거부합니다.
3. DocuMind 프로젝트에 연결하고 **`BLOB_READ_WRITE_TOKEN`**이 프로젝트 환경 변수에 등록되었는지 확인합니다. 실제 값은 서버에서만 사용하며 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.
4. 개발 환경에서 파일 작업도 실행하려면 같은 토큰을 안전하게 별도 등록합니다.

운영과 Preview를 격리하려면 서로 다른 Neon DB/브랜치와 Blob 저장소를 환경별로 연결하세요. 같은 연결 값을 쓰는 Preview는 운영 계정과 문서에도 접근합니다. 인증 쿠키는 접속 호스트별로 발급됩니다.

## 3. 빈 테이블 생성

두 서비스 연결 후 저장소 루트에서 실행합니다.

```bash
npm ci
npm run db:migrate
npm run check:services
```

`db:migrate`는 `migrations/001_neon.sql`과 `002_google_sso.sql`을 순서대로 각각 하나의 트랜잭션으로 실행하며 재실행 가능합니다. 또는 파일 전체를 Neon SQL Editor에 붙여 실행하세요. 사용자·문서·대화 샘플은 생성하지 않습니다. 마이그레이션은 빌드나 웹 요청 중 자동 실행하지 않습니다. 운영 DDL은 Codex에서 명시적으로 실행할 수 있습니다.

`check:services`는 스키마 버전 조회와 Blob 목록 읽기를 수행합니다. 빈 저장소의 비공개 설정 여부와 업로드 권한까지 증명하지는 않으므로 배포 후 작은 파일 업로드·원본 다운로드·삭제도 확인하세요. 실제 서비스가 없으면 이 검증을 완료할 수 없습니다.

Codex에 Neon만 연결한 상태에서는 `npm run check:services -- --database-only`로 DB 접속·스키마 버전·필수 테이블 9개를 검사할 수 있습니다. 이 옵션은 Blob 검사를 생략했다고 명시하며 파일 업로드 성공을 의미하지 않습니다. DB 운영 명령은 환경의 `HTTPS_PROXY`/`HTTP_PROXY`를 자동 사용하므로 Codex의 네트워크 시크릿을 HTTPS 요청으로 전달합니다. 프록시 인증정보는 출력하지 않습니다.

## 4. Vercel 배포

GitHub 연결과 Production Branch `main`을 유지합니다. 저장소의 `vercel.json`에서 배포를 건너뛰던 `ignoreCommand`를 제거했습니다. 프로젝트 Settings에 별도의 Ignored Build Step이 설정되어 있다면 Automatic으로 바꿉니다. 프레임워크는 Next.js, 출력은 `.next`이며 `public`으로 지정하지 않습니다.

환경 변수 등록 후 Redeploy합니다. Production과 Preview 각각 필요한 변수를 지정하세요. Preview에서는 `APP_ORIGIN`을 비워 현재 호스트를 사용하고, 고정 HTTPS 도메인에만 해당 origin을 지정합니다. 기존 잘못된 `DOCUMIND_DATA_DIR` 설정은 필요하지 않습니다.

확인 순서: 로그인 → 새 계정 생성 → 문서 0개 확인 → 업로드 → 인덱싱 완료 → 원본 다운로드 → 질문/근거 확인 → 새 배포 후 같은 계정 데이터 확인 → 삭제. 소스 재배포는 외부 DB·원본 파일을 초기화하지 않습니다. DB나 Blob을 직접 삭제하거나 다른 연결 값으로 바꾸는 작업은 별개입니다.

## 5. Codex에서 직접 DB 변경

Neon HTTP SQL SDK를 사용하므로 별도 DB 서버 구축이나 TCP 연결이 필요하지 않습니다. 공개 연결 호스트명(`ep-…neon.tech`, 비밀번호 없음)이 정해진 뒤 실제 HTTP SQL 목적지를 확인합니다. SDK는 연결 호스트의 첫 번째 레이블을 `api`로 바꾸어 사용합니다. 예를 들어 `ep-example-pooler.us-east-2.aws.neon.tech`이면 `api.us-east-2.aws.neon.tech`입니다. Codex 네트워크 허용 목록과 `DATABASE_URL` 시크릿 목적지에 이 **API 호스트**를 등록합니다. 프록시가 시크릿을 로컬에서 가리는 환경에서는 공개 변수 `NEON_HTTP_ENDPOINT=https://<API 호스트>/sql`도 지정합니다. 앱은 실제 연결 문자열을 해당 HTTPS 요청의 `Neon-Connection-String` 헤더로 전달합니다. 실제 네트워크 허용과 시크릿 바인딩이 적용된 새 작업에서 접속을 검증해야 합니다.

Blob 관리에는 SDK API 호스트 `vercel.com`과 생성된 `<store-id>.private.blob.vercel-storage.com`에 대한 허용 및 토큰 바인딩이 필요합니다. 생성 전 임의의 DB/Blob 호스트나 비밀값을 등록하지 않습니다. 연결 후 Codex에서 마이그레이션·쿼리·청크 정리·스키마 변경을 요청할 수 있습니다. 파괴적 데이터 변경 전에는 백업을 마련하세요. 연결 문자열과 토큰은 환경 설정의 보안 입력란에만 저장합니다.

## 6. 운영과 기존 데이터

삭제는 먼저 사용자 목록·검색·원본 접근에서 숨긴 뒤 Blob을 제거합니다. 이미 발급한 업로드 토큰은 최대 15분 유효하므로 삭제 기록을 잠시 유지합니다. 다음 업로드 때 만료된 기록과 늦게 도착한 파일을 재정리하며, 업로드가 없는 기간에는 운영자가 다음 명령을 주기적으로 실행하세요. 한 번에 최대 100건을 정리합니다. 자동 cron은 등록하지 않았습니다.

```bash
npm run storage:cleanup
```

분석 중 중단된 문서는 5분 후 재분석할 수 있습니다. 장시간 분석을 위한 백그라운드 큐는 별도 구현 대상입니다. 백업·복원과 보존 기간은 Neon/Blob 서비스 설정으로 관리합니다.

기존 SQLite 데이터를 보관 중인 경우 이전 서버를 멈추고 `data/` 전체(DB와 uploads)를 백업한 뒤 **빈 Neon DB**에 선택적으로 이관합니다. 원본은 변경·삭제하지 않습니다.

```bash
npm run db:import-sqlite -- --source /absolute/path/to/legacy-data
# 개수와 원본 파일 존재·크기를 검토한 뒤 적용
npm run db:import-sqlite -- --source /absolute/path/to/legacy-data --apply
```

계정 ID·비밀번호 해시·문서·청크·대화를 보존하고 세션은 옮기지 않으므로 다시 로그인합니다. 같은 대상에 재실행할 수 있지만 이관 도중 앱 쓰기를 허용하지 마세요. 기존 사용자 ID/이메일 충돌은 오류로 중단합니다. 이 명령은 원래 SQLite 버전 형식용이며 다른 DB 형식에는 사용하지 마세요. 새 설치에는 이관이 필요 없습니다.
