'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Folder,
  FileSearch,
  ChartNoAxesColumnIncreasing,
  Settings,
  Plus,
  LogOut,
  Database,
  Bell,
  CircleHelp,
  Menu,
  X,
  Building2,
  ChevronRight,
  FileText,
  Lock,
  Code,
  Sparkles,
} from 'lucide-react';
import { Brand } from './ui';
import { useWorkspace } from './workspace-provider';
import { getSupabase } from '@/lib/supabase/client';
const navigation = [
  ['/chat', 'AI 채팅 (RAG)', MessageSquare],
  ['/documents', '문서 지식 베이스', Folder],
  ['/admin', '워크스페이스 대시보드', ChartNoAxesColumnIncreasing],
  ['/settings', '워크스페이스 설정', Settings],
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { documents, notify, session, hydrated, connectionError, refresh } = useWorkspace();
  useEffect(() => {
    if (hydrated && !session) router.replace('/login');
  }, [hydrated, session, router]);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/chat?new=' + Date.now());
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [router]);
  if (!hydrated || !session)
    return (
      <div className="empty-state" role="status">
        로그인 확인 중…
      </div>
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        본문으로 이동
      </a>
      {open && (
        <button className="nav-backdrop" aria-label="메뉴 닫기" onClick={() => setOpen(false)} />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Link href="/chat" aria-label="DocuMind 홈">
            <Brand />
          </Link>
          <button
            className="mobile-close icon-button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="workspace-name">
            <Building2 size={17} />
            <span>{session.user.user_metadata.company || '내 워크스페이스'}</span>
          </div>
          <Link
            className="button primary new-chat"
            href="/chat?new=1"
            onClick={(event) => {
              event.preventDefault();
              router.push('/chat?new=' + Date.now());
              setOpen(false);
            }}
          >
            <Plus size={20} />새 채팅 시작<kbd>⌘K</kbd>
          </Link>
        </div>
        <nav>
          <div className="nav-label">워크스페이스 네비게이션</div>
          {navigation.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${(href === '/documents' ? path === href : href.startsWith('/documents/') ? path.startsWith('/documents/') : path === href) ? 'active' : ''}`}
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === '/documents' && <small>{documents.length}개 등록</small>}
            </Link>
          ))}
          <div className="nav-label mt-8">최근 분석 문서</div>
          {documents.slice(0, 3).map((doc) => (
            <Link href={`/documents/${doc.id}`} key={doc.id} className="recent">
              <FileText size={15} />
              {doc.name}
            </Link>
          ))}
          {!documents.length && <p className="muted text-xs px-4">아직 등록한 문서가 없습니다.</p>}
        </nav>
        <div className="profile">
          <div className="row">
            <span className="avatar">나</span>
            <div className="grow">
              <strong>{session.user.user_metadata.name || session.user.email}</strong>
              <small>Supabase 계정</small>
            </div>
            <button
              aria-label="로그아웃"
              className="icon-button"
              onClick={() => {
                void getSupabase()
                  .auth.signOut()
                  .then(({ error }) => {
                    if (error) notify(error.message);
                    else router.replace('/login');
                  });
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="row between mt-3">
            <small className="text-primary">● 개인 지식 베이스</small>
            <small className="muted">v0.2</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            DocuMind <ChevronRight size={16} />
            <span>지식 검색 에이전트</span>
          </div>
          <Link href="/documents" className="context-summary">
            <Database size={19} />
            <span>선택된 문서: 전체 지식 베이스</span>
            <strong>
              {documents.length}건 / {documents.reduce((a, d) => a + d.chunks, 0).toLocaleString()}{' '}
              Chunks
            </strong>
          </Link>
          <span className="sync-state">
            <span className="status-dot" />
            Supabase 워크스페이스
          </span>
          <button
            className="icon-button notification"
            aria-label="알림"
            onClick={() =>
              notify('문서 등록과 처리 상태는 문서 지식 베이스에서 확인할 수 있습니다.')
            }
          >
            <Bell size={19} />
            <i />
          </button>
          <button
            className="icon-button help"
            aria-label="도움말"
            onClick={() =>
              notify(
                '문서를 등록하고 AI 채팅에서 질문해 보세요. 출처를 누르면 원문과 청크를 확인할 수 있습니다.',
              )
            }
          >
            <CircleHelp size={19} />
          </button>
          <span className="avatar small">나</span>
        </header>
        <div className="demo-strip">
          <Sparkles size={13} />내 문서에서 근거를 검색합니다 · AI 키 미설정 시 원문 발췌 모드
        </div>
        <main id="main">
          {connectionError && (
            <div className="backend-notice" role="alert">
              <strong>{connectionError}</strong>
              <div className="row mt-3">
                <Link href="/settings" className="text-button">
                  설치 안내
                </Link>
                <button className="text-button" onClick={() => void refresh()}>
                  다시 연결
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
