'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  BadgeCheck,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  CheckCircle2,
  Building2,
  CloudOff,
  Network,
  Zap,
  User,
  IdCard,
  AtSign,
} from 'lucide-react';
import { Brand, Modal } from './ui';
import { PasswordStrength, SSOButtons } from './auth-ui';
import { useWorkspace } from './workspace-provider';
import { apiRequest } from '@/lib/client';
import { readableError } from '@/lib/documents';
export function AuthHeader() {
  const { notify, refreshSession } = useWorkspace();
  const path = usePathname();
  return (
    <header className="auth-header">
      <Link href="/login">
        <Brand enterprise />
      </Link>
      <nav>
        <Link
          href="/login"
          className={path === '/login' ? 'active' : ''}
          aria-current={path === '/login' ? 'page' : undefined}
        >
          로그인
        </Link>
        <button
          onClick={() =>
            notify('현재 이메일·비밀번호 로그인을 지원합니다. SSO는 별도 설정이 필요합니다.')
          }
        >
          SSO 연동
        </button>
        <button
          onClick={() =>
            notify(
              '서버의 SQLite DB와 비공개 원본 폴더를 사용합니다. 계정별 접근 권한을 서버에서 확인합니다.',
            )
          }
        >
          보안 인증 센터
        </button>
        <Link
          href="/signup"
          className={path === '/signup' ? 'active' : ''}
          aria-current={path === '/signup' ? 'page' : undefined}
        >
          접근 권한 신청
        </Link>
      </nav>
      <Link href="/login" className="brand-icon" aria-label="계정 로그인">
        <User size={20} />
      </Link>
    </header>
  );
}
export function AuthFooter() {
  return (
    <footer className="auth-footer">
      <span className="row">
        <ShieldCheck size={18} />
        DocuMind · 문서 기반 지식 검색
      </span>
      <span>© 2026 DocuMind</span>
    </footer>
  );
}
export function Login() {
  const router = useRouter();
  const { notify, refreshSession } = useWorkspace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiRequest('/api/auth/login', { email, password });
      await refreshSession();
      router.replace('/chat');
    } catch (error) {
      setError(readableError(error));
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    notify(
      '로컬 모드에서는 이메일 재설정을 제공하지 않습니다. 로그인 후 설정에서 비밀번호를 변경하거나 서버 관리자에게 문의하세요.',
    );
  }

  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="login-layout">
        <section className="login-marketing">
          <div className="pill">DocuMind · Document RAG</div>
          <h1>
            내 문서에서 찾는
            <br />
            <span>근거 있는 답변</span>
          </h1>
          <p className="marketing-description">
            문서를 업로드하고 필요한 내용을 질문하세요. 검색된 원문과 출처를 함께 확인할 수
            있습니다.
          </p>
          <div className="marketing-stats">
            <article className="card">
              <ShieldCheck size={32} />
              <h3 className="mt-4">나만의 지식 베이스</h3>
              <p>자체 로그인과 사용자별 데이터 접근 정책을 적용합니다.</p>
            </article>
            <article className="card">
              <BrainCircuit size={32} />
              <h3 className="mt-4">문서 기반 검색</h3>
              <p>처음에는 비어 있습니다. 직접 업로드한 문서만 답변의 근거로 사용합니다.</p>
            </article>
          </div>
        </section>
        <section className="login-form-section">
          <div className="card login-card">
            <h2>워크스페이스 로그인</h2>
            <p className="muted mt-3 mb-6">가입한 이메일과 비밀번호로 접속하세요.</p>
            <form onSubmit={login}>
              <label className="field">
                이메일
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </label>
              <label className="field mt-5">
                비밀번호
                <div className="input-with-icon">
                  <LockKeyhole size={20} />
                  <input
                    type={visible ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>
              <button
                type="button"
                className="text-button mt-4"
                disabled={busy}
                onClick={() => void reset()}
              >
                비밀번호를 잊으셨나요?
              </button>
              {error && (
                <p role="alert" className="error-box mt-4">
                  {error}
                </p>
              )}
              <button className="button primary login-submit mt-6" type="submit" disabled={busy}>
                {busy ? '연결 중…' : '워크스페이스 로그인'}
                <ArrowRight size={20} />
              </button>
            </form>
            <div className="inset mt-6">
              아직 계정이 없나요?{' '}
              <Link className="text-primary" href="/signup">
                회원가입
              </Link>
            </div>
          </div>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
export function Signup() {
  const { notify, refreshSession } = useWorkspace();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    purpose: '사내 규정 및 인사/회계 문서 Q&A',
    domain: '',
  });
  const [agreements, setAgreements] = useState([false, false, false]);
  const [terms, setTerms] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const personalEmail = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'outlook.com'].includes(
    profile.email.split('@')[1]?.toLowerCase(),
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="signup-layout">
        <div className="eyebrow">● Enterprise Workspace Provisioning</div>
        <h1>회원가입 및 신규 워크스페이스 개설</h1>
        <div className="signup-steps">
          {['계정 정보 입력', '기업 워크스페이스 설정', '초기 보안 및 RAG 권한 설정'].map(
            (t, i) => (
              <div className={step === i + 1 ? 'active' : ''} key={t}>
                <span>{i + 1}</span>
                <div>
                  <small>Step 0{i + 1}</small>
                  <h3>{t}</h3>
                  <small className="muted">
                    {
                      [
                        '업무용 계정 및 프로필 입력',
                        '소속 정보와 사용 목적',
                        '문서 파이프라인 & 격리 레벨',
                      ][i]
                    }
                  </small>
                </div>
              </div>
            ),
          )}
        </div>
        <div className="signup-grid">
          <section className="card signup-card">
            <span className="pill">로컬 계정 생성</span>
            <h2 className="mt-3">기업용 DocuMind 가입 시작</h2>
            <p className="muted mt-3 mb-6">
              가입하면 비어 있는 개인 문서 지식 베이스를 사용할 수 있습니다.
            </p>
            {step === 1 && (
              <div className="signup-sso">
                <p className="muted text-xs mb-3">기업 SSO 계정으로 시작하기</p>
                <SSOButtons signup />
                <div className="divider">또는 업무용 이메일로 직접 계정 생성</div>
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setError('');
                if (step === 1) {
                  if (password !== confirm) {
                    setError('비밀번호가 일치하지 않습니다.');
                    return;
                  }
                  if (!agreements[0] || !agreements[1]) {
                    setError('필수 약관 두 항목에 동의해 주세요.');
                    return;
                  }
                  setStep(2);
                } else if (step === 2) setStep(3);
                else {
                  setBusy(true);
                  try {
                    await apiRequest('/api/auth/register', {
                      email: profile.email,
                      password,
                      name: profile.name,
                      company: profile.company,
                    });
                    await refreshSession();
                    router.replace('/chat');
                  } catch (error) {
                    setError(readableError(error));
                  } finally {
                    setBusy(false);
                  }
                }
              }}
            >
              {step === 1 ? (
                <>
                  <label className="field">
                    이름 및 직책 *
                    <div className="input-with-icon">
                      <IdCard size={19} />
                      <input
                        required
                        placeholder="홍길동 수석연구원 / 팀장"
                        autoComplete="name"
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </label>
                  <label className="field mt-4">
                    업무용 이메일 주소 *
                    <div className="input-with-icon">
                      <AtSign size={19} />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        autoComplete="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </label>
                  {personalEmail && (
                    <p className="domain-warning" role="status">
                      기업 업무용 이메일을 권장합니다. 개인 이메일도 사용할 수 있습니다.
                    </p>
                  )}
                  <div className="form-grid mt-4">
                    <label className="field">
                      소속 기업 / 기관명 *
                      <div className="input-with-icon">
                        <Building2 size={19} />
                        <input
                          required
                          placeholder="(주)미래전략연구소"
                          value={profile.company}
                          onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                        />
                      </div>
                    </label>
                    <label className="field">
                      RAG 구축 주요 목적 *
                      <select
                        value={profile.purpose}
                        onChange={(e) => setProfile((p) => ({ ...p, purpose: e.target.value }))}
                      >
                        <option>사내 규정 및 인사/회계 문서 Q&A</option>
                        <option>연구개발 및 기술문서 검색</option>
                        <option>고객사 기술지원 AI 코파일럿</option>
                        <option>계약서 및 법무 검토 지원</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-grid mt-4">
                    <label className="field">
                      비밀번호 설정 *
                      <div className="input-with-icon">
                        <input
                          required
                          type={visible ? 'text' : 'password'}
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="8자 이상"
                        />
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="비밀번호 표시 전환"
                          onClick={() => setVisible(!visible)}
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </label>
                    <label className="field">
                      비밀번호 확인 *
                      <div className="input-with-icon">
                        <input
                          required
                          type={confirmVisible ? 'text' : 'password'}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          autoComplete="new-password"
                          placeholder="비밀번호 재입력"
                        />
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="비밀번호 확인 표시 전환"
                          onClick={() => setConfirmVisible(!confirmVisible)}
                        >
                          {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>
                  </div>
                  <PasswordStrength password={password} />
                  <div className="signup-agreements inset mt-4">
                    <label className="row agreement-all">
                      <input
                        type="checkbox"
                        checked={agreements.every(Boolean)}
                        onChange={(e) => setAgreements(agreements.map(() => e.target.checked))}
                      />
                      약관 전체 동의하기
                    </label>
                    {[
                      '[필수] 문서 서비스 이용 안내 확인',
                      '[필수] 개인정보 수집 및 데이터 보안 안내 확인',
                      '[선택] 사용 안내 확인',
                    ].map((label, i) => (
                      <div className="agreement-row" key={label}>
                        <label className="row">
                          <input
                            type="checkbox"
                            aria-required={i < 2}
                            checked={agreements[i]}
                            onChange={(e) =>
                              setAgreements((a) =>
                                a.map((v, index) => (index === i ? e.target.checked : v)),
                              )
                            }
                          />
                          {label}
                        </label>
                        {i === 0 && (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setTerms(true)}
                          >
                            상세보기
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="muted text-xs">
                      계정과 업로드 문서는 이 서버의 SQLite DB와 원본 폴더에 저장됩니다. 마케팅
                      이메일은 발송하지 않습니다.
                    </p>
                  </div>
                </>
              ) : step === 2 ? (
                <>
                  <label className="field">
                    소속 기업 / 기관명 *
                    <input
                      required
                      placeholder="(주)미래전략연구소"
                      value={profile.company}
                      onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                    />
                  </label>
                  <label className="field mt-4">
                    기업 도메인 *
                    <input
                      required
                      placeholder="company.com"
                      pattern="[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
                      value={profile.domain}
                      onChange={(e) => setProfile((p) => ({ ...p, domain: e.target.value }))}
                    />
                  </label>
                  <label className="field mt-4">
                    RAG 구축 주요 목적
                    <select
                      value={profile.purpose}
                      onChange={(e) => setProfile((p) => ({ ...p, purpose: e.target.value }))}
                    >
                      <option>사내 규정 및 인사/회계 문서 Q&A</option>
                      <option>연구개발 및 기술문서 검색</option>
                      <option>계약서 및 법무 검토 지원</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <h3>초기 RAG 권한 설정</h3>
                  <label className="field mt-4">
                    문서 기본 접근 범위
                    <select disabled>
                      <option>본인만 접근 가능 (사용자별 격리)</option>
                    </select>
                  </label>
                  <div className="inset mt-5">
                    <label className="row">
                      <input
                        type="checkbox"
                        required
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                      계정 및 문서 저장 안내를 확인했습니다.
                    </label>
                    <p className="text-xs muted mt-3">
                      계정은 서버에서 처리하며 비밀번호는 해시로 저장합니다. 문서와 대화는 본인
                      계정에 저장되며, 같은 회사 이름으로 가입해도 공유되지 않습니다.
                    </p>
                  </div>
                </>
              )}
              {error && (
                <p className="error-box mt-4" role="alert">
                  {error}
                </p>
              )}
              <div className="row mt-6">
                {step > 1 && (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => setStep(step - 1)}
                  >
                    이전
                  </button>
                )}
                <button className="button primary grow" type="submit" disabled={busy}>
                  {busy ? '계정 생성 중…' : step === 3 ? '계정 만들기' : '다음 단계'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
            <div className="inset mt-6 text-sm">
              이미 DocuMind 계정이 있으신가요?{' '}
              <Link className="text-primary" href="/login">
                로그인하기
              </Link>
            </div>
          </section>
          <aside>
            <section className="card signup-card">
              <div className="eyebrow text-green-800">
                <ShieldCheck size={18} />
                Enterprise RAG Infrastructure
              </div>
              <h2>안심할 수 있는 보안 인프라</h2>
              <p className="muted mt-3 mb-5">내 계정에 연결된 문서와 대화만 사용합니다.</p>
              {[
                [
                  CloudOff,
                  '비공개 파일 저장소',
                  '원본은 비공개 폴더에 보관하고 인증된 요청으로 확인합니다.',
                ],
                [
                  ShieldCheck,
                  '사용자별 접근 제어',
                  '다른 사용자의 문서와 대화는 서버에서 계정별로 분리합니다.',
                ],
                [
                  Zap,
                  '텍스트 추출 및 청크 검색',
                  '다양한 문서를 청크화하고 복합 검색 인덱스로 변환합니다.',
                ],
              ].map(([Icon, title, text]) => {
                const I = Icon as typeof CloudOff;
                return (
                  <div className="inset feature" key={String(title)}>
                    <I size={27} className="text-primary" />
                    <div>
                      <h3>{String(title)}</h3>
                      <p>{String(text)}</p>
                    </div>
                  </div>
                );
              })}
            </section>
            <section className="card signup-card mt-6">
              <h3 className="row">
                <Network size={20} />
                격리 파이프라인 아키텍처
              </h3>
              {[
                '인증된 사용자만 원본 열람',
                '문서 청크화 및 키워드 검색',
                '정확한 출처 인라인 인용 (Citations)',
              ].map((t) => (
                <div className="inset mt-4 row" key={t}>
                  <CheckCircle2 size={17} className="text-primary" />
                  {t}
                </div>
              ))}
            </section>
          </aside>
        </div>
      </main>
      {terms && (
        <Modal title="DocuMind 이용 안내" onClose={() => setTerms(false)}>
          <p className="muted">
            계정 정보와 대화는 이 서버의 SQLite DB에, 원본 문서는 비공개 파일 폴더에 저장합니다.
            문서는 로그인한 본인만 접근할 수 있습니다. AI 생성 모드를 활성화하면 질문과 검색된 문서
            발췌가 AI 제공자에게 전달됩니다. 결제와 마케팅 구독은 생성하지 않습니다.
          </p>
          <button type="button" className="button primary mt-5" onClick={() => setTerms(false)}>
            확인
          </button>
        </Modal>
      )}
      <AuthFooter />
    </div>
  );
}
