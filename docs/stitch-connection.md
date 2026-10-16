# Stitch MCP 연결

이 저장소의 `.codex/config.toml`에는 Stitch의 원격 MCP 서버가 등록되어 있습니다. 키 값은 저장소에 포함하지 않고 `STITCH_API_KEY` 환경 변수에서 `X-Goog-Api-Key` 요청 헤더로 전달합니다.

- 서버: `https://stitch.googleapis.com/mcp`
- 인증: Stitch API key (`STITCH_API_KEY`)
- 공식 공개 자료: [Stitch MCP 설정](https://stitch.withgoogle.com/docs/mcp/setup/), [Google Labs Stitch SDK](https://github.com/google-labs-code/stitch-sdk#configuration)

## 클라우드 환경에서 필요한 설정

1. Stitch MCP 설정 가이드에 따라 본인 계정의 API 키를 발급합니다.
2. 이 Codex 클라우드 환경의 환경 설정에서 `STITCH_API_KEY` 보안 요구 사항에 값을 입력합니다. 채팅, GitHub, `NEXT_PUBLIC_*`, `.codex/config.toml`에 키를 넣지 않습니다. 이 키는 웹 애플리케이션이나 Vercel에 필요하지 않습니다.
3. 환경 설정에 저장된 네트워크/비밀 요구 사항을 검토·저장하고 환경을 게시합니다. 키가 주입된 새 작업에서 다음 검사를 실행합니다.

```bash
cd /workspace/docu_agent
python3 scripts/stitch-check.py
```

이 검사는 MCP 초기화, 도구 목록 조회, `list_projects`만 수행하며 디자인을 변경하지 않습니다. 키나 프로젝트 내용을 로그에 출력하지 않습니다. 환경 설정 저장만으로 현재 실행 중인 작업의 변수가 바뀌었다고 가정하지 않습니다.

## Codex에서 사용

지원되는 Codex CLI/App에서는 신뢰한 저장소의 `.codex/config.toml`을 읽고, 새 세션에서 MCP를 연결합니다. 관리형 클라우드의 전역 Codex 설정은 읽기 전용일 수 있고, 현재 대화의 도구 목록은 파일 수정만으로 갱신되지 않습니다.

프로젝트 설정을 읽을 수 없는 CLI에서는 명시적인 설정 오버라이드를 제공하는 실행 스크립트를 사용합니다. 이 스크립트는 전역 설정이나 `CODEX_HOME`을 변경하지 않습니다.

```bash
bash scripts/codex-stitch.sh mcp list   # 등록된 설정 확인: 서버 접속 성공을 의미하지 않음
bash scripts/codex-stitch.sh           # Stitch MCP 설정으로 새 CLI 세션 시작
```

현재 Codex 웹 클라이언트가 사용자 지정 MCP 등록을 제공하지 않는 경우, 이 파일만으로 그 웹 대화에 Stitch 도구를 추가할 수는 없습니다. MCP를 지원하는 Codex CLI/App에서 이 저장소를 열거나, 클라우드 작업에서는 `stitch-check.py`와 같은 승인된 API 호출로 연결을 검증해야 합니다.

연결 검증 후 Stitch 프로젝트 URL/ID를 지정하여 최신 화면을 조회하고 Next.js 코드에 반영하도록 요청할 수 있습니다. 키 등록만으로 파일이 GitHub에 자동 동기화되거나 기존 UI가 자동 변경되지는 않습니다. 디자인 변경 감지와 PR 자동 생성은 별도 작업입니다.

## 디자인 변환용 플러그인 (선택)

Google Labs의 [stitch-skills](https://github.com/google-labs-code/stitch-skills)는 MCP를 사용하는 별도 도구 모음입니다. MCP 인증을 완료한 다음, 플러그인을 지원하는 Codex에서 해당 저장소의 설치 가이드에 따라 `stitch-build`를 설치할 수 있습니다. 이 클라우드 대화에 플러그인이 설치된 것으로 간주하지 않습니다.
