'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  Activity,
  Files,
  MessagesSquare,
  BadgeCheck,
  Coins,
  Download,
  BookOpen,
  History,
  ArrowUpRight,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { FileIcon, Modal, StatCard, downloadText } from './ui';
const bars = [120, 142, 155, 100, 170, 184, 196, 150, 202, 188, 220, 212, 230, 240];
export function Dashboard() {
  const { documents, notify } = useWorkspace();
  const [period, setPeriod] = useState('30');
  const [logs, setLogs] = useState('all');
  const [schedule, setSchedule] = useState(false);
  const [time, setTime] = useState('02:00');
  const ready = documents.filter((d) => d.status === 'ready').length;
  const events = [
    {
      type: 'processing',
      title: '임베딩 진행',
      time: '3분 전',
      text: '이서연 수석이 신임직원 온보딩 가이드 임베딩을 시작했습니다.',
    },
    {
      type: 'ready',
      title: '품질 검증 통과',
      time: '7분 전',
      text: 'AI 질문 자동 평가: Grounding Score 98점 통과 (안전 응답 승인)',
    },
    {
      type: 'ready',
      title: '벡터 DB 동기화',
      time: '12분 전',
      text: `벡터 DB 클러스터 동기화 완료 (총 ${documents.reduce((a, d) => a + d.chunks, 0)} vectors)`,
    },
    {
      type: 'failed',
      title: '업로드 차단 / 실패',
      time: '45분 전',
      text: '구형 스캔문서 암호화본 업로드 실패 (DRM 암호화 감지)',
    },
  ];
  const questions = period === '30' ? 14280 : 3332;
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Activity size={22} />
            DocuMind Telemetry <span className="badge ready">실시간 동기화 예시</span>
          </div>
          <h1>RAG 서비스 운영 관리자 대시보드</h1>
          <p>
            사내 AI 지식 베이스 검색 현황, 질의 트래픽, 토큰 소모량 및 시스템 성능 지표를
            모니터링합니다.
          </p>
        </div>
        <div className="row flex-wrap">
          <label className="row button secondary">
            <CalendarDays size={18} />
            <select
              aria-label="통계 기간"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="30">최근 30일 (샘플 데이터)</option>
              <option value="7">최근 7일 (샘플 데이터)</option>
            </select>
          </label>
          <button
            className="button primary"
            onClick={() =>
              downloadText(
                'DocuMind-운영리포트.csv',
                `지표,값,데이터 유형\n기간,${period}일,Mock\n등록 문서,${documents.length},로컬 데이터\n질문 횟수,${questions},Mock\n응답 정확도,96.8%,Mock\n토큰 사용량,8.4M,Mock`,
                'text/csv;charset=utf-8',
              )
            }
          >
            <Download size={17} />
            리포트 내보내기
          </button>
        </div>
      </div>
      <div className="stats-grid four">
        <StatCard
          label="총 등록 문서 수"
          value={documents.length}
          suffix="건"
          icon={<Files size={23} />}
          detail={
            <>
              파싱 청크 수{' '}
              <b className="text-primary">
                {documents.reduce((a, d) => a + d.chunks, 0).toLocaleString()} Chunks
              </b>
            </>
          }
        />
        <StatCard
          label="AI 질문 및 검색 횟수"
          value={questions.toLocaleString()}
          suffix="건"
          icon={<MessagesSquare size={23} />}
          detail={
            <>
              일평균 질의량 <b>476건 / 일 · Mock</b>
            </>
          }
        />
        <StatCard
          label="RAG 응답 정확도"
          value={<span className="text-green-800">96.8%</span>}
          icon={<BadgeCheck size={23} />}
          detail={
            <>
              할루시네이션 방지 <b className="text-green-800">99.2% · Mock</b>
            </>
          }
        />
        <StatCard
          label="OpenAI API 토큰 소모량"
          value="8.4M"
          suffix="/ 20.0M"
          icon={<Coins size={23} />}
          detail={
            <>
              <div className="progress">
                <i style={{ width: '42%' }} />
              </div>
              <span className="block mt-2">
                월 한도 대비 <b className="text-primary">42% 소진</b> · 추정 $420
              </span>
            </>
          }
        />
      </div>
      <div className="dashboard-charts">
        <section className="card chart-card">
          <div className="row between flex-wrap">
            <div>
              <h2>일별 RAG 질의 트래픽 & 검색 성공률 추이</h2>
              <p className="muted text-xs mt-2">
                최근 {period}일간의 사용자 질문 발생량과 근거 문서 정합성 지표 (Mock)
              </p>
            </div>
            <div className="chart-legend">
              <span>■ 질문 건수</span>
              <span>━ 매칭률</span>
            </div>
          </div>
          <div className="traffic-chart">
            <svg
              viewBox="0 0 700 300"
              role="img"
              aria-label={`최근 ${period}일 모의 질의 트래픽 및 검색 성공률 차트`}
            >
              <defs>
                <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3975ee" />
                  <stop offset="100%" stopColor="#e9edff" />
                </linearGradient>
              </defs>
              {[35, 95, 155, 215, 275].map((y) => (
                <line
                  key={y}
                  x1="8"
                  x2="690"
                  y1={y}
                  y2={y}
                  stroke="#e2e7ff"
                  strokeDasharray="4 4"
                />
              ))}
              {bars.slice(period === '7' ? 7 : 0).map((height, i, array) => (
                <rect
                  key={i}
                  x={26 + i * (650 / array.length)}
                  y={280 - height}
                  width={period === '7' ? 40 : 22}
                  height={height}
                  rx="3"
                  fill="url(#bar-gradient)"
                />
              ))}
              <path
                d="M35 66 C120 60 135 55 190 57 S280 54 330 50 S420 50 480 45 S560 37 610 37 L670 32"
                stroke="#007d55"
                strokeWidth="4"
                fill="none"
              />
              {[35, 145, 250, 355, 460, 565, 670].map((x, i) => (
                <circle
                  cx={x}
                  cy={[66, 58, 56, 50, 47, 38, 32][i]}
                  r="4"
                  fill="white"
                  stroke="#007d55"
                  strokeWidth="3"
                  key={x}
                />
              ))}
            </svg>
            <div className="row between mono muted text-xs">
              <span>09.16</span>
              <span>09.21</span>
              <span>09.26</span>
              <span>10.01</span>
              <span>10.06</span>
              <span>10.11</span>
              <b className="text-primary">10.15</b>
            </div>
          </div>
        </section>
        <section className="card chart-card">
          <h2>문서 저장 현황 및 벡터 분석</h2>
          <p className="muted text-xs mt-2">형식별 인덱싱 비중 및 파이프라인 무결성</p>
          <div className="donut-section">
            <div
              className="donut"
              role="img"
              aria-label="PDF 68%, DOCX 18%, MD/TXT 14%의 모의 분포"
            >
              <div>
                <strong>{documents.length}</strong>
                <small>Total Docs</small>
              </div>
            </div>
            <div className="donut-legend">
              <span>
                <i />
                PDF <b>68%</b>
              </span>
              <span>
                <i />
                DOCX <b>18%</b>
              </span>
              <span>
                <i />
                MD / TXT <b>14%</b>
              </span>
            </div>
          </div>
          <div className="inset">
            <div className="row between text-xs">
              <span>인덱싱 파이프라인 헬스체크</span>
              <b className="text-green-800">Mock 상태</b>
            </div>
            <div className="health-grid">
              <div>
                <b className="text-green-800">{ready}건</b>
                <small>정상 완료</small>
              </div>
              <div>
                <b className="text-indigo-600">
                  {documents.filter((d) => d.status === 'processing').length}건
                </b>
                <small>진행중</small>
              </div>
              <div>
                <b className="text-red-600">
                  {documents.filter((d) => d.status === 'failed').length}건
                </b>
                <small>경고/실패</small>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="card chart-card">
          <div className="row between">
            <h2 className="row">
              <BookOpen size={23} className="text-primary" />
              가장 많이 인용된 인기 지식 문서 TOP 5
            </h2>
            <Link href="/documents" className="text-button">
              전체 보기 →
            </Link>
          </div>
          <p className="muted text-xs mt-2">
            RAG 에이전트가 답변 생성 시 참조한 빈도가 높은 문서 (Mock)
          </p>
          <div className="popular-list">
            {documents.slice(0, 5).map((d, i) => (
              <Link href={`/documents/${d.id}`} key={d.id} className="popular-document">
                <span className="rank">{i + 1}</span>
                <FileIcon type={d.type} />
                <div className="grow min-w-0">
                  <b>{d.name}</b>
                  <small>
                    {d.category} | {d.chunks} Chunks | v2.1
                  </small>
                </div>
                <b className="text-primary">{[1420, 980, 845, 620, 410][i].toLocaleString()}회</b>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
        <section className="card chart-card">
          <div className="row between flex-wrap">
            <h2 className="row">
              <History size={22} className="text-primary" />
              실시간 시스템 이벤트 및 감사 로그
            </h2>
            <select
              aria-label="감사 로그 필터"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
            >
              <option value="all">전체 이벤트</option>
              <option value="ready">정상 완료</option>
              <option value="failed">실패</option>
              <option value="processing">진행 중</option>
            </select>
          </div>
          <p className="muted text-xs mt-2">
            인덱싱 파이프라인 및 RAG 엔진 주요 발생 이벤트 (Mock)
          </p>
          <div className="timeline event-list">
            {events
              .filter((e) => logs === 'all' || e.type === logs)
              .map((e) => (
                <div key={e.title} className={e.type}>
                  <div className="row between">
                    <b>{e.title}</b>
                    <small className="muted">{e.time}</small>
                  </div>
                  <p>{e.text}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
      <div className="schedule-notice">
        <ShieldCheck size={26} />
        <div className="grow">
          <h3>정기 벡터 인덱스 최적화 예정 (Re-indexing Notice)</h3>
          <p>매주 일요일 {time} KST, HNSW 그래프 압축 및 만료 청크 정리 시뮬레이션입니다.</p>
        </div>
        <button className="button secondary" onClick={() => setSchedule(true)}>
          스케줄 관리
        </button>
      </div>
      {schedule && (
        <Modal title="인덱스 최적화 스케줄 (Mock)" onClose={() => setSchedule(false)}>
          <label className="field">
            매주 일요일 실행 시각 (KST)
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <p className="muted text-xs mt-4">
            실제 작업 예약은 수행하지 않으며 이 화면에서만 적용됩니다.
          </p>
          <button
            className="button primary mt-5"
            onClick={() => {
              setSchedule(false);
              notify('데모 스케줄을 변경했습니다. 실제 작업은 예약되지 않습니다.');
            }}
          >
            설정 적용
          </button>
        </Modal>
      )}
    </div>
  );
}
