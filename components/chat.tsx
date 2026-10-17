'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BrainCircuit,
  Send,
  PanelRight,
  X,
  Copy,
  Download,
  Plus,
  FileSearch,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { FileIcon, Modal, downloadText } from './ui';
import { getSupabase, apiRequest } from '@/lib/supabase/client';
import { citationsFromJson, readableError, type Citation } from '@/lib/documents';
type Turn = { id: string; question: string; answer: string; citations: Citation[]; mode: string };
type Conversation = { id: string; title: string };
export function Chat() {
  const { documents, notify, session, connectionError } = useWorkspace();
  const query = useSearchParams();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState('');
  const [context, setContext] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [split, setSplit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const requestLock = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const ready = documents.filter((d) => d.status === 'ready');
  function reset() {
    generation.current++;
    setConversationId(undefined);
    setTurns([]);
    setActiveCitations([]);
    setPending('');
    setError('');
    setHistoryLoading(false);
  }
  useEffect(() => {
    if (query.has('new')) reset();
  }, [query]);
  useEffect(() => {
    setSplit(window.innerWidth > 1050);
  }, []);
  async function loadConversations() {
    const { data, error } = await getSupabase()
      .from('conversations')
      .select('id,title')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) setError(readableError(error));
    else setConversations(data || []);
  }
  useEffect(() => {
    if (session) void loadConversations();
  }, [session?.user.id]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, pending]);
  async function loadConversation(id: string) {
    if (busy) return;
    const current = ++generation.current;
    setError('');
    setHistoryLoading(true);
    const { data, error } = await getSupabase()
      .from('chat_turns')
      .select('id,question,answer,citations,mode')
      .eq('conversation_id', id)
      .order('created_at')
      .limit(100);
    if (current !== generation.current) return;
    setHistoryLoading(false);
    if (error) {
      setError(readableError(error));
      return;
    }
    setConversationId(id);
    setTurns((data || []).map((t) => ({ ...t, citations: citationsFromJson(t.citations) })));
    setActiveCitations(citationsFromJson(data?.at(-1)?.citations));
  }
  async function send() {
    const question = input.trim();
    if (!question || requestLock.current || !ready.length || connectionError || historyLoading)
      return;
    requestLock.current = true;
    setBusy(true);
    setError('');
    setPending(question);
    setInput('');
    const current = generation.current;
    try {
      const turn = await apiRequest('/api/chat', {
        question,
        conversationId,
        documentIds: context,
      });
      if (current === generation.current) {
        setTurns((old) => [...old, turn]);
        setActiveCitations(turn.citations);
        setConversationId(turn.conversationId);
      }
      await loadConversations();
    } catch (error) {
      if (current === generation.current) {
        setError(readableError(error));
        setInput(question);
      }
    } finally {
      if (current === generation.current) setPending('');
      requestLock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="chat-root">
      <section className="chat-heading">
        <div className="row gap-3">
          <span className="ai-icon">
            <BrainCircuit size={23} />
          </span>
          <div>
            <h1>문서 기반 AI 채팅</h1>
            <p className="muted text-xs mt-2">
              검색 가능한 문서 {ready.length}개 ·{' '}
              {context.length ? `${context.length}개 선택` : '전체 문서에서 검색'}
            </p>
          </div>
        </div>
        <div className="row mt-4 flex-wrap">
          <div className="segmented">
            <button className={split ? 'active' : ''} onClick={() => setSplit(true)}>
              <PanelRight size={14} />
              스플릿 뷰
            </button>
            <button className={!split ? 'active' : ''} onClick={() => setSplit(false)}>
              <MessageSquare size={14} />
              단일 뷰
            </button>
          </div>
          <select
            aria-label="저장된 대화"
            value={conversationId || ''}
            disabled={busy || historyLoading}
            onChange={(e) => (e.target.value ? void loadConversation(e.target.value) : reset())}
          >
            <option value="">새 대화</option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label="대화 내역 내보내기"
            disabled={!turns.length}
            onClick={() =>
              downloadText(
                'DocuMind-대화.txt',
                turns
                  .map(
                    (t) =>
                      `질문: ${t.question}\n\n${t.answer}\n\n${t.citations.map((c, i) => `[${i + 1}] ${c.document_name} · 청크 ${c.position + 1}`).join('\n')}`,
                  )
                  .join('\n\n'),
              )
            }
          >
            <Download size={18} />
          </button>
          <button className="icon-button" aria-label="새 대화" onClick={reset}>
            <Plus size={18} />
          </button>
        </div>
      </section>
      <div className={`chat-layout ${split ? '' : 'single'}`}>
        <section className="conversation" aria-label="AI 대화">
          <div className="message-stream">
            {!turns.length && !pending && (
              <div className="empty-chat">
                <BrainCircuit size={42} />
                <h2>{ready.length ? '문서에서 답을 찾아보세요' : '먼저 문서를 업로드하세요'}</h2>
                <p>
                  {ready.length
                    ? '업로드한 문서의 내용을 질문하면 관련 원문과 출처를 보여드립니다.'
                    : '등록된 문서가 없습니다. 문서 분석이 완료되면 질문할 수 있습니다.'}
                </p>
                <Link className="button primary mt-4" href="/documents">
                  문서 관리로 이동
                </Link>
              </div>
            )}
            {historyLoading && <p role="status">대화 내역을 불러오는 중…</p>}
            {turns.map((turn) => (
              <div key={turn.id}>
                <div className="message user">
                  <span className="avatar">나</span>
                  <div className="message-body">
                    <strong>나</strong>
                    <p className="whitespace-pre-wrap">{turn.question}</p>
                  </div>
                </div>
                <div className="message assistant">
                  <span className="ai-icon">
                    <BrainCircuit size={22} />
                  </span>
                  <div className="message-body">
                    <div className="row between">
                      <strong>DocuMind</strong>
                      <span className="tag">
                        {turn.mode === 'generated'
                          ? 'AI 생성'
                          : turn.mode === 'extractive'
                            ? '원문 발췌'
                            : '검색 결과 없음'}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap mt-4">{turn.answer}</p>
                    <div className="row flex-wrap mt-4">
                      {turn.citations.map((c, i) => (
                        <Link key={c.chunk_id} href={`/documents/${c.document_id}`} className="tag">
                          [{i + 1}] {c.document_name} · 청크 {c.position + 1}
                        </Link>
                      ))}
                    </div>
                    <div className="row mt-4">
                      <button
                        className="text-button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(turn.answer);
                            notify('답변을 복사했습니다.');
                          } catch {
                            notify('클립보드 접근이 허용되지 않았습니다.');
                          }
                        }}
                      >
                        <Copy size={14} />
                        복사
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          setActiveCitations(turn.citations);
                          setSplit(true);
                        }}
                      >
                        근거 보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {pending && (
              <div className="processing-card" role="status">
                <RefreshCw size={20} className="animate-spin" />
                <div>
                  <b>{pending}</b>
                  <p>업로드한 문서에서 관련 근거를 검색하고 있습니다.</p>
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <div ref={end} />
          </div>
          <div className="composer-wrap">
            <div className="row flex-wrap text-xs muted mb-2">
              검색 컨텍스트: {context.length ? `${context.length}개 문서 선택` : '전체 준비된 문서'}
              <button className="text-button" onClick={() => setPicker(true)}>
                문서 선택
              </button>
            </div>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                aria-label="질문 입력"
                placeholder={
                  ready.length
                    ? '문서에 사용된 키워드로 질문하세요…'
                    : '문서를 업로드하고 분석을 완료해 주세요.'
                }
                disabled={!ready.length || !!connectionError}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <div className="row between">
                <span className="muted text-xs">{2000 - input.length}자 남음</span>
                <button
                  className="button primary"
                  disabled={
                    busy || historyLoading || !ready.length || !input.trim() || !!connectionError
                  }
                  type="submit"
                >
                  질문하기
                  <Send size={16} />
                </button>
              </div>
            </form>
            <p className="muted text-xs mt-3">
              답변의 근거를 확인하세요. AI 키를 설정하지 않으면 검색한 원문을 발췌합니다.
            </p>
          </div>
        </section>
        {split && (
          <aside className="evidence" aria-label="답변 근거 패널">
            <div className="evidence-header">
              <div className="row between">
                <h3 className="row">
                  <FileSearch size={19} />
                  답변 근거 및 청크 분석
                </h3>
                <button
                  className="icon-button"
                  aria-label="근거 패널 닫기"
                  onClick={() => setSplit(false)}
                >
                  <X size={19} />
                </button>
              </div>
              <p className="muted text-xs mt-3">실제 검색된 원문 {activeCitations.length}건</p>
            </div>
            <div className="evidence-content">
              {activeCitations.map((c, i) => (
                <article className="source-card" key={c.chunk_id}>
                  <div className="row">
                    <FileIcon />
                    <strong className="source-title">
                      [{i + 1}] {c.document_name}
                    </strong>
                  </div>
                  <span className="tag mt-3">청크 #{c.position + 1}</span>
                  <blockquote>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                  </blockquote>
                  <Link className="source-link" href={`/documents/${c.document_id}`}>
                    원본 문서 및 청크 확인
                  </Link>
                </article>
              ))}
              {!activeCitations.length && (
                <p className="muted">질문 후 검색된 근거가 여기에 표시됩니다.</p>
              )}
            </div>
          </aside>
        )}
      </div>
      {picker && (
        <Modal title="검색 컨텍스트 선택" onClose={() => setPicker(false)}>
          <p className="muted mb-4">선택하지 않으면 전체 준비된 문서에서 검색합니다.</p>
          <div className="context-picker">
            {ready.map((d) => (
              <label className="row p-3" key={d.id}>
                <input
                  type="checkbox"
                  checked={context.includes(d.id)}
                  onChange={(e) =>
                    setContext((old) =>
                      e.target.checked ? [...old, d.id] : old.filter((id) => id !== d.id),
                    )
                  }
                />
                <FileIcon type={d.type} />
                {d.name}
              </label>
            ))}
          </div>
          <button className="button primary mt-5" onClick={() => setPicker(false)}>
            선택 완료
          </button>
        </Modal>
      )}
    </div>
  );
}
