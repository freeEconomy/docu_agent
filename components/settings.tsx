'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, Database, ShieldCheck } from 'lucide-react';
import { requestJson } from '@/lib/client';
import { useWorkspace } from './workspace-provider';
import { readableError } from '@/lib/documents';
export function Settings() {
  const { session, connectionError, loading, refresh } = useWorkspace();
  const [aiEnabled, setAiEnabled] = useState(false);
  useEffect(() => {
    void requestJson<{ aiEnabled: boolean }>('/api/settings')
      .then((r) => setAiEnabled(r.aiEnabled))
      .catch(() => {});
  }, []);
  return (
    <div className="page-content settings-page">
      <div className="eyebrow">
        <SettingsIcon size={18} />
        Workspace Settings
      </div>
      <h1 className="mt-2 mb-2">워크스페이스 설정</h1>
      <p className="muted mb-7">이 서버의 SQLite 데이터베이스와 문서 저장소를 사용합니다.</p>
      <section className="card p-6">
        <h2 className="row">
          <Database size={20} />
          SQLite 연결
        </h2>
        <dl className="mt-5">
          <dt>로그인 계정</dt>
          <dd className="mt-2">{session?.user.email}</dd>
          <dt className="mt-5">저장 위치 (기본 설정)</dt>
          <dd className="mono mt-2">data/documind.sqlite · data/uploads/</dd>
          <dt className="mt-5">연결 상태</dt>
          <dd className="mt-2" role="status">
            {loading ? '확인 중…' : connectionError || '로컬 문서 테이블 조회 성공'}
          </dd>
        </dl>
        <button className="button secondary mt-5" onClick={() => void refresh()}>
          연결 다시 확인
        </button>
        <Link className="button secondary mt-5 ml-3" href="/reset-password">
          비밀번호 변경
        </Link>
      </section>
      <section className="card p-6 mt-6">
        <h2>저장과 백업</h2>
        <p className="muted mt-4">
          문서·청크·대화·계정은 SQLite에 저장되며 원본은 비공개 폴더에 보관합니다. 서버를 재시작해도
          유지됩니다. 운영 서버에서는 영구 디스크를 연결하고 data 폴더를 백업하세요.
        </p>
        <p className="muted mt-4">
          Vercel에서는 로컬 데이터를 영구 저장할 수 없습니다. Docker 또는 파일 쓰기가 가능한 Node.js
          서버에서 실행하세요. 서버 관리자는 DOCUMIND_DATA_DIR로 저장 위치를 지정할 수 있습니다.
        </p>
      </section>
      <section className="card p-6 mt-6">
        <h2>문서 검색과 AI 답변</h2>
        <p className="mt-4">
          현재 모드: <strong>{aiEnabled ? 'AI 생성' : '원문 발췌'}</strong>
        </p>
        <p className="muted mt-4">
          SQLite FTS5와 한글 부분 일치로 실제 문서 청크를 검색합니다. 서버에 RAG_API_KEY를 설정하면
          OpenAI가 검색된 근거로 답변을 생성합니다. API 키가 없으면 원문과 출처를 반환합니다.
        </p>
        <p className="row text-xs muted mt-5">
          <ShieldCheck size={17} />
          비밀번호 해시와 HttpOnly 세션 쿠키를 사용하며 계정별 문서 접근을 제한합니다.
        </p>
      </section>
    </div>
  );
}
