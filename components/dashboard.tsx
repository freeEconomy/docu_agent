'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChartNoAxesColumnIncreasing,
  Folder,
  MessageSquare,
  Network,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { StatCard, Badge, downloadText } from './ui';
import { requestJson } from '@/lib/client';
import { readableError } from '@/lib/documents';
type RecentTurn = { id: string; question: string; mode: string; created_at: string };
export function Dashboard() {
  const { documents, session } = useWorkspace();
  const [days, setDays] = useState('30');
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState<RecentTurn[]>([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!session) return;
    setLoading(true);
    setError('');
    void requestJson<{ count: number; recent: RecentTurn[] }>(`/api/dashboard?days=${days}`)
      .then((result) => {
        if (active) {
          setCount(result.count);
          setRecent(result.recent);
        }
      })
      .catch((error) => {
        if (active) setError(readableError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, session?.user.id, version]);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ChartNoAxesColumnIncreasing size={17} />
            Workspace Overview
          </div>
          <h1>지식 베이스 대시보드</h1>
          <p>내 계정의 실제 문서와 질문 내역을 확인합니다.</p>
        </div>
        <div className="row flex-wrap">
          <select aria-label="통계 기간" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>
          <button className="button secondary" onClick={() => setVersion((v) => v + 1)}>
            <RefreshCw size={16} />
            새로고침
          </button>
          <button
            className="button secondary"
            disabled={loading || !!error}
            onClick={() =>
              downloadText(
                'DocuMind-운영현황.txt',
                `문서: ${documents.length}\n청크: ${documents.reduce((n, d) => n + d.chunks, 0)}\n최근 ${days}일 질문: ${count}\n`,
              )
            }
          >
            <Download size={16} />
            보고서 다운로드
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-box mb-5">
          {error}
        </p>
      )}
      <div className="stats-grid three">
        <StatCard
          label="총 보관 문서"
          value={documents.length}
          suffix="건"
          icon={<Folder size={23} />}
          detail={`분석 완료 ${documents.filter((d) => d.status === 'ready').length}건 · 실패 ${documents.filter((d) => d.status === 'failed').length}건`}
        />
        <StatCard
          label="저장된 문서 청크"
          value={documents.reduce((n, d) => n + d.chunks, 0)}
          suffix="개"
          icon={<Network size={23} />}
          detail="업로드 파일에서 실제 추출한 청크"
        />
        <StatCard
          label={`최근 ${days}일 질문`}
          value={loading || error ? '—' : count}
          suffix="회"
          icon={<MessageSquare size={23} />}
          detail="정상 저장된 질문과 답변 기준"
        />
      </div>
      <div className="document-real-grid mt-6">
        <section className="card p-6 min-w-0">
          <h2>최근 문서</h2>
          {documents.length ? (
            documents.slice(0, 5).map((d) => (
              <Link className="row between inset mt-4" href={`/documents/${d.id}`} key={d.id}>
                <span className="truncate">{d.name}</span>
                <Badge status={d.status} />
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <Folder size={32} />
              <p>등록된 문서가 없습니다.</p>
              <Link href="/documents" className="button primary mt-4">
                첫 문서 업로드
              </Link>
            </div>
          )}
        </section>
        <section className="card p-6 min-w-0">
          <h2>최근 질문</h2>
          {recent.map((t) => (
            <article className="inset mt-4" key={t.id}>
              <p>{t.question}</p>
              <p className="muted text-xs mt-2">
                {new Date(t.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} ·{' '}
                {t.mode === 'generated'
                  ? 'AI 생성'
                  : t.mode === 'extractive'
                    ? '원문 발췌'
                    : '검색 결과 없음'}
              </p>
            </article>
          ))}
          {!recent.length && (
            <div className="empty-state">
              <MessageSquare size={32} />
              <p>
                {loading
                  ? '질문 내역을 불러오는 중…'
                  : error
                    ? '질문 내역을 확인할 수 없습니다.'
                    : '아직 질문 내역이 없습니다.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
