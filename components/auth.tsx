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
export function AuthHeader() {
  const { notify } = useWorkspace();
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
            notify('SSO 연동은 다음 단계에서 제공됩니다. 현재 데모 로그인으로 체험할 수 있습니다.')
          }
        >
          SSO 연동
        </button>
        <button
          onClick={() =>
            notify('이 프론트엔드 데모는 실제 보안 인증 또는 암호화 인프라를 제공하지 않습니다.')
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
        DocuMind Enterprise RAG · 프론트엔드 데모
      </span>
      <span>© 2026 DocuMind · 인증 및 인프라 기능은 연동 예정</span>
    </footer>
  );
}
export function Login() {
  const router = useRouter();
  const { notify } = useWorkspace();
  const [tab, setTab] = useState('sso');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  function login() {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('documind-demo-session', 'demo');
    notify('데모 워크스페이스에 입장했습니다. 실제 인증은 수행하지 않습니다.');
    router.push('/chat');
  }
  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="login-layout">
        <section className="login-marketing">
          <div className="pill">● RAG Pro Enterprise v4.8</div>
          <h1>
            지능형 RAG 기반
            <br />
            <span>사내 지식 검색 & AI 에이전트</span>
          </h1>
          <p className="marketing-description">
            할루시네이션 없는 근거 중심의 지능형 문서 벡터화 및 검색 증강 생성(RAG) 플랫폼입니다. 단
            한 번의 질의로 방대한 전사 지식 베이스에서 즉각 검증 가능한 답변과 원본 출처를
            도출하세요.
          </p>
          <div className="marketing-stats">
            <article className="card">
              <div className="row between">
                <span className="marketing-stat-icon">
                  <BadgeCheck size={27} />
                </span>
                <span className="badge ready">ϟ 0.28s 응답</span>
              </div>
              <strong>99.9%</strong>
              <h3>실시간 벡터 검색 정확도</h3>
              <p>하이브리드 BM25 & Dense Vector 랭킹 모델을 통한 정확한 단락 추출</p>
            </article>
            <article className="card">
              <div className="row between">
                <span className="marketing-stat-icon indigo">
                  <ShieldCheck size={27} />
                </span>
                <span className="tag">AES-256 GCM</span>
              </div>
              <strong>100%</strong>
              <h3>사내 문서 암호화 파이프라인</h3>
              <p>전송 중 및 저장 데이터 암호화, 고객사 전용 키(BYOK) 지원 예정</p>
            </article>
          </div>
          <article className="card retrieval-monitor">
            <div className="row between inset">
              <strong className="row">
                <BrainCircuit size={20} className="text-primary" />
                DocuMind Semantic Retrieval Monitor
              </strong>
              <small className="text-green-800">● 인덱싱 파이프라인 예시</small>
            </div>
            <div className="inset mt-4">
              <div className="row between">
                <b>Q. &quot;2025 상반기 해외 법인 라이선스 규약 조항 변경 내역&quot;</b>
                <span className="tag">유사도 94.8%</span>
              </div>
              <blockquote>
                &quot;...계약서 제14조 2항에 의거, 2025년 3월 1일부로 EU 및 APAC 리전 라이선스
                사용권은 본사 데이터 거버넌스 승인 절차를 거쳐 자동 갱신된다...&quot;
                <div className="tag mt-3">2025_글로벌_법률컴플라이언스_개정안.pdf (p.14)</div>
              </blockquote>
            </div>
          </article>
          <div className="compliance">
            <p>엔터프라이즈 보안 및 클라우드 컴플라이언스 디자인 예시</p>
            <div>
              {[
                ['SOC 2 Type II', 'AICPA 국제인증'],
                ['ISO/IEC 27001', '정보보호관리체계'],
                ['KISA CSAP', '공공/금융 보안규격'],
                ['VPC & 온프레미스', '에어갭 망분리 지원'],
              ].map(([title, description]) => (
                <span key={title}>
                  <ShieldCheck size={23} />
                  <span className="compliance-label">
                    <b>{title}</b>
                    <small>{description}</small>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
        <section className="login-side">
          <div className="login-card">
            <div className="row between">
              <h2>엔터프라이즈 로그인</h2>
              <span className="pill text-xs">● SSO 2.0 지원 예정</span>
            </div>
            <p className="muted mt-3 mb-6">
              사내 인증 포털 계정 또는 지정된 업무용 이메일로 접속하세요.
            </p>
            <div className="segmented auth-tabs">
              <button className={tab === 'sso' ? 'active' : ''} onClick={() => setTab('sso')}>
                기업 SSO 간편인증
              </button>
              <button className={tab === 'email' ? 'active' : ''} onClick={() => setTab('email')}>
                업무용 계정 로그인
              </button>
            </div>
            {tab === 'sso' && <SSOButtons />}
            <div className="divider">또는 업무용 이메일로 로그인</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login();
              }}
            >
              <label className="field">
                업무용 이메일 주소
                <div className="input-with-icon">
                  <Mail size={20} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="name@company.com"
                  />
                </div>
              </label>
              <small className="muted block mt-2 mb-5">
                데모용 이메일을 입력하세요. 실제 계정과 비밀번호는 사용하지 마세요.
              </small>
              <label className="field">
                <span className="row between">
                  비밀번호
                  <button
                    type="button"
                    className="text-button text-xs"
                    onClick={() =>
                      notify(
                        '데모에서는 비밀번호 재설정 메일을 발송하지 않습니다. 임의의 8자 이상 비밀번호로 로그인하세요.',
                      )
                    }
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </span>
                <div className="input-with-icon">
                  <LockKeyhole size={20} />
                  <input
                    type={visible ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    placeholder="데모용 비밀번호 8자 이상"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <Eye size={19} /> : <EyeOff size={19} />}
                  </button>
                </div>
              </label>
              <div className="row between mt-5 mb-5 text-sm">
                <label className="row">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  로그인 상태 유지 (데모)
                </label>
                <span className="muted text-xs">⚿ OTP / MFA 연동 예정</span>
              </div>
              <button className="button primary login-submit" type="submit">
                워크스페이스 로그인
                <ArrowRight size={22} />
              </button>
            </form>
            <button className="text-button demo-entry" onClick={login}>
              입력 없이 데모 바로 체험하기 →
            </button>
            <div className="inset text-sm muted mt-5">
              이 화면은 Mock 로그인입니다. 실제 인증, SSO, 접근 제어는 Supabase 연동 단계에서
              제공됩니다. 비밀번호는 저장하지 않습니다.
            </div>
            <div className="login-card-footer">
              <Link href="/signup">사내 권한 승인 신청</Link>
              <span>·</span>
              <Link href="/signup">신규 테넌트 개설</Link>
              <span className="muted">IT Helpdesk 24/7</span>
            </div>
          </div>
          <p className="text-xs muted text-center mt-4">
            Stitch 디자인 기반 · 실제 인증 및 보안 인증을 의미하지 않습니다.
          </p>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
export function Signup() {
  const { notify } = useWorkspace();
  const router = useRouter();
  const [step, setStep] = useState(1);
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
                        '업무용 계정 및 프로필 검증',
                        '도메인 식별 및 벡터 DB 클러스터',
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
            <span className="pill">30일 무료 엔터프라이즈 체험 디자인</span>
            <h2 className="mt-3">기업용 DocuMind 가입 시작</h2>
            <p className="muted mt-3 mb-6">
              전용 워크스페이스 개설 흐름을 데모로 체험할 수 있습니다.
            </p>
            {step === 1 && (
              <div className="signup-sso">
                <p className="muted text-xs mb-3">기업 SSO 계정으로 시작하기</p>
                <SSOButtons signup />
                <div className="divider">또는 업무용 이메일로 직접 계정 생성</div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
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
                  sessionStorage.setItem('documind-demo-session', 'demo');
                  notify('데모 워크스페이스가 준비되었습니다. 실제 계정은 생성되지 않았습니다.');
                  router.push('/chat');
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
                      기업 업무용 이메일을 권장합니다. 이 데모에서는 개인 이메일도 사용할 수
                      있습니다.
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
                          placeholder="데모용 8자 이상"
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
                      '[필수] DocuMind 엔터프라이즈 이용약관 동의',
                      '[필수] 개인정보 수집 및 데이터 보안 안내 확인',
                      '[선택] 기능 업데이트 안내 수신',
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
                      데모 동의 상태만 사용하며 실제 약관 계약이나 마케팅 구독은 생성하지 않습니다.
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
                    <select>
                      <option>워크스페이스 멤버</option>
                      <option>관리자 전용</option>
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
                      데모 환경 안내 및 개인정보 처리 안내를 확인했습니다.
                    </label>
                    <p className="text-xs muted mt-3">
                      실제 계정 생성이나 보안 정책 적용은 수행하지 않습니다. 입력 정보와 비밀번호는
                      저장되지 않습니다.
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
                <button className="button primary grow" type="submit">
                  {step === 3 ? '데모 워크스페이스 시작하기' : '다음 단계'}
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
              <p className="muted mt-3 mb-5">
                Stitch 디자인에 포함된 제품 비전입니다. 아래 기능은 실제 서비스 연동 시 구현할
                예정입니다.
              </p>
              {[
                [
                  CloudOff,
                  '제로 데이터 리텐션 (Zero Retention)',
                  '사내 문서가 모델 재학습에 활용되지 않도록 설계합니다.',
                ],
                [
                  ShieldCheck,
                  '세분화된 RBAC 권한 제어',
                  '부서별, 직급별, 프로젝트별 문서 접근 권한을 분리합니다.',
                ],
                [
                  Zap,
                  '초고속 하이브리드 인덱싱 파이프라인',
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
                '문서 암호화 (AES-256-GCM)',
                '임베딩 벡터화 & 네임스페이스 격리',
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
        <Modal title="DocuMind 데모 이용 안내" onClose={() => setTerms(false)}>
          <p className="muted">
            이 화면은 Stitch 디자인의 가입 절차를 체험하는 프론트엔드 데모입니다. 실제 계정, 결제,
            마케팅 구독은 생성하지 않으며 입력한 비밀번호를 저장하거나 외부로 전송하지 않습니다.
            정식 서비스 이용약관과 개인정보 처리방침은 실제 인증 연동 시 제공됩니다.
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
