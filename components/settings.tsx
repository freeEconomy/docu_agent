'use client';
import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database } from 'lucide-react';
import { useWorkspace } from './workspace-provider';
export function Settings() {
  const { notify } = useWorkspace();
  const [name, setName] = useState('(주)미래전략연구소');
  const [citations, setCitations] = useState(true);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('documind-settings') ?? 'null');
      if (saved) {
        setName(saved.name);
        setCitations(saved.citations);
      }
    } catch {}
  }, []);
  return (
    <div className="page-content settings-page">
      <div className="eyebrow">
        <SettingsIcon size={18} />
        Workspace Settings
      </div>
      <h1 className="mt-2 mb-2">워크스페이스 설정</h1>
      <p className="muted mb-7">브라우저에 저장되는 데모 워크스페이스 설정입니다.</p>
      <form
        className="card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem('documind-settings', JSON.stringify({ name, citations }));
          notify('데모 설정을 브라우저에 저장했습니다.');
        }}
      >
        <h2 className="mb-5">기본 설정</h2>
        <label className="field">
          워크스페이스 이름
          <input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="row mt-6">
          <input
            type="checkbox"
            checked={citations}
            onChange={(e) => setCitations(e.target.checked)}
          />
          출처 표시 기본 설정 (향후 RAG 연동 시 적용)
        </label>
        <button className="button primary mt-6" type="submit">
          설정 저장
        </button>
      </form>
      <section className="card p-6 mt-6">
        <h2 className="row mb-4">
          <Database size={20} />
          서비스 연동
        </h2>
        <div className="row between inset">
          <span>Supabase · 인증 / 데이터베이스 / Storage</span>
          <span className="tag">다음 단계</span>
        </div>
        <div className="row between inset mt-3">
          <span>RAG · 벡터 검색 / 임베딩 / LLM</span>
          <span className="tag">다음 단계</span>
        </div>
        <p className="row text-xs muted mt-5">
          <ShieldCheck size={17} />
          현재 데모에는 실제 인증 또는 권한 제한이 적용되지 않습니다.
        </p>
      </section>
    </div>
  );
}
