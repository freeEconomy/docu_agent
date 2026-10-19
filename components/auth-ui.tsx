'use client';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiRequest, requestJson } from '@/lib/client';
import { useWorkspace } from './workspace-provider';

export function ProviderMark({ provider }: { provider: 'google' | 'microsoft' | 'okta' }) {
  if (provider === 'google') {
    return (
      <svg className="provider-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.4 13.93A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.52l3.34-2.59Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.86-2.86A9.59 9.59 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59c.79-2.36 3-4.12 5.6-4.12Z"
        />
      </svg>
    );
  }
  if (provider === 'microsoft') {
    return (
      <svg className="provider-mark" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#f25022" d="M1 1h10v10H1z" />
        <path fill="#7fba00" d="M13 1h10v10H13z" />
        <path fill="#00a4ef" d="M1 13h10v10H1z" />
        <path fill="#ffb900" d="M13 13h10v10H13z" />
      </svg>
    );
  }
  return (
    <span className="provider-okta" aria-hidden="true">
      ok
    </span>
  );
}

export function SSOFeedback() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errors: Record<string, string> = {
      cancelled: 'Google 로그인이 취소되었습니다.',
      expired: '로그인 요청이 만료되었거나 브라우저 세션이 다릅니다. 다시 시작하세요.',
      not_configured: 'Google Workspace SSO 설정이 아직 완료되지 않았습니다.',
      domain_denied: '이 워크스페이스에서 허용한 Google Workspace 도메인이 아닙니다.',
      account_exists:
        '이미 등록된 이메일입니다. 이메일·비밀번호로 로그인한 뒤 설정에서 Google 계정을 연결하세요.',
      link_conflict: '이미 다른 계정에 연결된 Google 계정이거나 기존 연결과 다릅니다.',
      invalid_identity: 'Google 인증을 확인할 수 없습니다. 다시 시도하세요.',
      failed: 'Google 로그인 처리에 실패했습니다. 다시 시도하거나 관리자에게 문의하세요.',
    };
    const code = params.get('sso_error');
    setMessage(
      code
        ? errors[code] || errors.failed
        : params.get('sso') === 'linked'
          ? 'Google 계정 연결을 완료했습니다.'
          : '',
    );
    if (code || params.has('sso')) {
      params.delete('sso_error');
      params.delete('sso');
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (params.size ? '?' + params : '') + window.location.hash,
      );
    }
  }, []);
  return message ? (
    <p role="status" className="inset mt-4 mb-4">
      {message}
    </p>
  ) : null;
}

export function SSOButtons({ signup = false }: { signup?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    void requestJson<{ google: boolean }>('/api/auth/sso/providers')
      .then((r) => setEnabled(r.google))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);
  return (
    <div id="sso" className={`sso-buttons ${signup ? 'signup-sso-buttons' : ''}`}>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => {
          window.location.assign('/api/auth/sso/google/start');
        }}
      >
        <ProviderMark provider="google" />
        {signup ? 'Google Workspace로 시작하기' : 'Google Workspace 계정으로 로그인'}
        <ArrowRight size={16} />
      </button>
      {!enabled && (
        <p className="muted text-xs" role="status">
          {checked
            ? 'Google Workspace SSO는 관리자 설정 후 사용할 수 있습니다.'
            : 'SSO 연결 확인 중…'}
        </p>
      )}
    </div>
  );
}

export function GoogleConnection() {
  const { notify } = useWorkspace();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void Promise.all([
      requestJson<{ google: boolean }>('/api/auth/sso/providers'),
      requestJson<{ email: string | null }>('/api/auth/sso/google/account'),
    ])
      .then(([providers, account]) => {
        setReady(providers.google);
        setEmail(account.email);
      })
      .catch(() => notify('Google 계정 연결 상태를 확인하지 못했습니다.'));
  }, [notify]);
  async function link() {
    setBusy(true);
    try {
      const result = await apiRequest<{ url: string }>('/api/auth/sso/google/link', {});
      window.location.assign(result.url);
    } catch (error) {
      notify(error instanceof Error ? error.message : '연결을 시작하지 못했습니다.');
      setBusy(false);
    }
  }
  return (
    <section className="card p-6 mt-6">
      <h2>Google Workspace SSO</h2>
      <SSOFeedback />
      <p className="muted mt-4">
        {email
          ? `연결된 Google 계정: ${email}`
          : 'Google 계정을 연결하면 기존 문서와 대화를 그대로 사용하며 Google로 로그인할 수 있습니다.'}
      </p>
      {!ready && (
        <p className="muted mt-4">
          관리자가 Google Workspace SSO 설정을 완료해야 사용할 수 있습니다.
        </p>
      )}
      {!email && (
        <button
          className="button secondary mt-5"
          type="button"
          disabled={!ready || busy}
          onClick={() => void link()}
        >
          {busy ? '연결 중…' : 'Google 계정 연결'}
        </button>
      )}
    </section>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: '8자 이상', valid: password.length >= 8 },
    { label: '영문 대소문자', valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: '숫자 포함', valid: /\d/.test(password) },
    { label: '특수문자 조합', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = rules.filter((r) => r.valid).length;
  const labels = ['매우 취약', '매우 취약', '보통', '안전', '매우 강력'];
  return (
    <div className="password-strength inset mt-4" aria-label="비밀번호 보안 강도">
      <div className="row between text-xs muted">
        <span>보안 강도</span>
        <strong aria-live="polite">{password ? labels[score] : '입력 대기'}</strong>
      </div>
      <div className={`strength-segments strength-${score}`} aria-hidden="true">
        {rules.map((r, i) => (
          <span className={i < score ? 'filled' : ''} key={r.label} />
        ))}
      </div>
      <ul className="password-rules">
        {rules.map(({ label, valid }) => (
          <li key={label} className={valid ? 'valid' : ''}>
            {valid ? <CheckCircle2 size={12} /> : <Circle size={10} />}
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
