# Google Workspace SSO

Google OpenID Connect Authorization Code + PKCE 로그인을 지원합니다. Google Workspace 계정만 허용하며 개인 Gmail 계정, Microsoft Entra ID, Okta/SAML은 지원하지 않습니다. OAuth 설정이 없으면 로그인·가입 화면에 설정 필요 상태를 표시합니다. 기존 이메일·비밀번호 인증은 유지됩니다.

## 운영 설정

1. Google Cloud Console → Google Auth Platform에서 프로젝트를 선택합니다. 사내 Workspace 전용 프로젝트라면 Audience를 Internal로 설정합니다. External 테스트 모드에서는 테스트 사용자를 등록해야 합니다. 요청 범위는 `openid email profile`이며 Google Drive 접근 권한은 요청하지 않습니다.
2. Clients에서 **Web application** OAuth 클라이언트를 생성합니다. Authorized redirect URIs에 다음 주소를 정확히 등록합니다.

   ```text
   https://docuagent-xi.vercel.app/api/auth/sso/google/callback
   ```

3. Vercel `docu_agent` 프로젝트 → Settings → Environment Variables → **Production**에 아래 값을 등록합니다. Client Secret은 채팅·Git·브라우저 공개 변수에 넣지 마세요.

   | 변수                       | 값                                                       |
   | -------------------------- | -------------------------------------------------------- |
   | `APP_ORIGIN`               | `https://docuagent-xi.vercel.app`                        |
   | `GOOGLE_CLIENT_ID`         | Google OAuth 클라이언트 ID                               |
   | `GOOGLE_CLIENT_SECRET`     | Google OAuth 클라이언트 시크릿                           |
   | `GOOGLE_WORKSPACE_DOMAINS` | 허용할 회사 도메인. 예: `example.com,subsidiary.example` |

   도메인은 이메일 접미사 대신 Google이 서명한 `hd` 클레임과 정확히 대조합니다. Workspace 기본·별칭 도메인이 다르면 실제 `hd` 값에 맞춰 설정하세요. 빈 목록이나 `*`는 허용하지 않습니다.

4. `npm run db:migrate`로 스키마 버전 2를 설치한 뒤 재배포합니다. 기존 사용자·문서·대화는 삭제하지 않습니다. `npm run check:services -- --database-only`로 스키마와 필수 테이블 9개를 검사합니다.
5. `/api/auth/sso/providers`가 `{"google":true}`를 반환하는지 확인하고 아래 실제 계정 검증을 수행합니다. 이 상태는 설정 존재 여부이며 Google의 클라이언트 유효성을 증명하지는 않습니다.

Preview에 Production OAuth 설정을 복사하지 마세요. Preview는 별도 DB·클라이언트·고정 origin과 그 origin의 콜백 등록이 필요합니다. 등록된 origin이 다른 주소에서는 SSO를 시작하지 않습니다. 로컬은 `http://localhost:3000` 같은 루프백 origin과 해당 콜백을 별도 등록할 수 있습니다.

## 계정 동작과 검증

- 새 Workspace 사용자: Google 로그인 → 신규 계정 생성 → `/chat`. 사용자 ID와 Google `sub`를 연결하고 문서·대화는 사용자별로 격리합니다.
- 기존 이메일 계정: 이메일·비밀번호로 로그인 → 설정 → **Google 계정 연결** → Google 동의 → 연결 완료. 이후 Google로 로그인해도 같은 문서·대화를 사용합니다. 이메일이 같아도 자동 병합하지 않습니다.
- 이미 다른 DocuMind 계정에 연결된 Google 계정은 다시 연결하지 않습니다. 연결 해제·관리자 강제 병합은 구현하지 않았습니다.
- Google로만 생성한 계정에는 비밀번호가 없습니다. Google로 로그인해야 하며 현재 비밀번호를 요구하는 변경 화면에서는 로컬 비밀번호를 설정할 수 없습니다.
- 실제 허용 도메인 계정으로 신규 로그인·재로그인·기존 계정 연결을 확인하고, 다른 도메인과 개인 Gmail 거부, 동의 취소, 만료 콜백 거부도 확인하세요. 실제 Workspace 인증은 유효한 OAuth 앱과 사용자 참여가 있어야 완료할 수 있습니다.

## 보안과 운영

`state`는 브라우저의 HttpOnly·SameSite=Lax 쿠키에 바인딩하며 HTTPS에서는 Secure 및 `__Host-` 접두사를 사용합니다. 10분 뒤 만료되고 콜백 처리 시 원자적으로 소모되어 재사용할 수 없습니다. PKCE S256과 nonce를 사용합니다. ID 토큰은 고정된 Google 공개키로 RS256 서명·issuer·audience·발급/만료 시간·nonce·이메일 검증·Workspace `hd`를 검증합니다. 사용자 입력으로 키 주소나 토큰 교환 주소를 바꾸지 않습니다.

Google access/refresh/ID 토큰과 Client Secret을 DB·로그·브라우저 저장소에 보관하지 않습니다. 로그인 후에는 기존 DocuMind의 해시 기반 세션을 발급합니다. 로컬 로그아웃은 Google 계정에서 로그아웃시키지 않으며 Google 계정 비활성화가 이미 발급된 DocuMind 세션을 즉시 취소하지는 않습니다. DocuMind 세션 만료는 기존 정책대로 7일입니다. 만료된 OAuth 시도는 다음 로그인 시작 때 정리합니다.

Vercel 런타임은 `accounts.google.com`, `oauth2.googleapis.com`, `www.googleapis.com`에 접근할 수 있어야 합니다. Codex에서 Google API를 직접 호출한다면 별도로 네트워크 허용 및 안전한 인증정보 설정이 필요합니다.

`npm run test:backend`는 서명된 테스트 ID 토큰과 격리된 PostgreSQL 엔진으로 위 보안 조건·재사용 차단·이메일 충돌·계정 연결을 검사합니다. 실제 Google 로그인 검증을 대체하지 않습니다.
