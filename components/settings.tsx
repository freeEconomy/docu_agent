'use client';
import { Settings as SettingsIcon, ShieldCheck, Database } from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { supabaseUrl } from '@/lib/supabase/config';
export function Settings() {
  const { session, connectionError, loading, refresh } = useWorkspace();
  return (
    <div className="page-content settings-page">
      <div className="eyebrow">
        <SettingsIcon size={18} />
        Workspace Settings
      </div>
      <h1 className="mt-2 mb-2">워크스페이스 설정</h1>
      <p className="muted mb-7">계정과 실제 데이터베이스 연결 상태를 확인합니다.</p>
      <section className="card p-6">
        <h2 className="row">
          <Database size={20} />
          Supabase 연결
        </h2>
        <dl className="mt-5">
          <dt>프로젝트</dt>
          <dd className="mono break-all mt-2">{supabaseUrl}</dd>
          <dt className="mt-5">로그인 계정</dt>
          <dd className="mt-2">{session?.user.email}</dd>
          <dt className="mt-5">데이터베이스 상태</dt>
          <dd className="mt-2" role="status">
            {loading ? '확인 중…' : connectionError || '문서 테이블 조회 성공'}
          </dd>
        </dl>
        <button className="button secondary mt-5" onClick={() => void refresh()}>
          연결 다시 확인
        </button>
      </section>
      <section className="card p-6 mt-6">
        <h2>최초 데이터베이스 설치</h2>
        <ol className="setup-steps mt-5">
          <li>Supabase 프로젝트의 SQL Editor를 엽니다.</li>
          <li>
            GitHub 저장소의 <code>supabase/migrations/202610180001_documind.sql</code> 전체를 복사해
            한 번 실행합니다.
          </li>
          <li>
            Authentication → URL Configuration에서 배포 도메인을 Site URL 및 Redirect URLs에
            등록합니다. <code>/chat</code>, <code>/reset-password</code> 경로도 허용합니다.
          </li>
          <li>이 화면에서 연결 다시 확인을 누른 후 문서를 업로드합니다.</li>
        </ol>
        <p className="muted mt-5">
          이 SQL은 문서·청크·대화 테이블, 비공개 파일 버킷, 사용자별 접근 정책을 만듭니다. 샘플
          문서는 추가하지 않습니다.
        </p>
      </section>
      <section className="card p-6 mt-6">
        <h2>문서 검색과 AI 답변</h2>
        <p className="muted mt-4">
          기본 설정에서는 실제 문서 청크를 키워드와 부분 일치로 검색해 원문을 발췌합니다. 임베딩이나
          AI 생성 결과를 가장하지 않습니다.
        </p>
        <p className="muted mt-4">
          AI 생성을 사용하려면 Vercel 프로젝트의 Environment Variables에 서버 전용{' '}
          <code>RAG_API_KEY</code> (OpenAI API 키)를 추가하고 재배포하세요. 모델은{' '}
          <code>RAG_MODEL</code>로 지정할 수 있으며 기본값은 <code>gpt-4o-mini</code>입니다. 키를
          프론트엔드 코드나 채팅에 입력하지 마세요.
        </p>
        <p className="row text-xs muted mt-5">
          <ShieldCheck size={17} />
          사용자별 RLS를 적용합니다. 현재 기업 멤버 공유 및 부서별 관리자 권한은 제공하지 않습니다.
        </p>
      </section>
    </div>
  );
}
