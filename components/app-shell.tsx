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
const navigation = [
  ['/chat', 'AI 채팅 (RAG)', MessageSquare],
  ['/documents', '문서 지식 베이스', Folder],
  ['/documents/DOC-8942', '문서 상세 및 청크 분석', FileSearch],
  ['/admin', '관리자 대시보드', ChartNoAxesColumnIncreasing],
  ['/settings', '워크스페이스 설정', Settings],
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { documents, notify } = useWorkspace();
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
            <span>(주)미래전략연구소 Enterprise</span>
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
          {[
            ['2024 사업계획서 v3.4', FileText, 'DOC-8942'],
            ['사내 정보보안 가이드라인', Lock, 'DOC-3810'],
            ['Core API 기술명세서 rev2', Code, 'DOC-3811'],
          ].map(([label, Icon, id]) => {
            const I = Icon as typeof FileText;
            return (
              <Link href={`/documents/${id}`} key={String(id)} className="recent">
                <I size={15} />
                {String(label)}
              </Link>
            );
          })}
        </nav>
        <div className="profile">
          <div className="row">
            <span className="avatar">SY</span>
            <div className="grow">
              <strong>이서연 수석연구원</strong>
              <small>AI전략팀 · 데모 계정</small>
            </div>
            <button
              aria-label="로그아웃"
              className="icon-button"
              onClick={() => {
                sessionStorage.removeItem('documind-demo-session');
                localStorage.removeItem('documind-demo-session');
                router.push('/login');
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="row between mt-3">
            <small className="text-primary">● Enterprise 체험</small>
            <small className="muted">v0.1 Mock</small>
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
            미래전략연구소 <ChevronRight size={16} />
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
            Mock 워크스페이스
          </span>
          <button
            className="icon-button notification"
            aria-label="알림"
            onClick={() =>
              notify(
                '현재 화면은 Mock 데이터 데모입니다. 실제 서비스 연결은 다음 단계에서 제공됩니다.',
              )
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
          <span className="avatar small">SY</span>
        </header>
        <div className="demo-strip">
          <Sparkles size={13} />
          프론트엔드 데모 · AI 응답, 인덱싱, 로그인 및 운영 지표는 Mock 데이터입니다.
        </div>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
