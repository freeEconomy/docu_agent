'use client';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
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

export function SSOButtons({ signup = false }: { signup?: boolean }) {
  const { notify } = useWorkspace();
  const providers = [
    {
      id: 'google' as const,
      label: signup ? 'Google Workspace SSO' : 'Google Workspace 계정으로 로그인',
    },
    {
      id: 'microsoft' as const,
      label: signup ? 'Microsoft Entra ID' : 'Microsoft Azure AD / Entra ID',
    },
    ...(!signup ? [{ id: 'okta' as const, label: 'Okta / SAML 2.0 단일 인증 (SSO)' }] : []),
  ];
  return (
    <div className={`sso-buttons ${signup ? 'signup-sso-buttons' : ''}`}>
      {providers.map(({ id, label }) => (
        <button
          type="button"
          key={id}
          onClick={() =>
            notify(
              `${label}: 실제 SSO는 미연동입니다. 이메일·비밀번호 가입과 로그인을 이용해 주세요.`,
            )
          }
        >
          <ProviderMark provider={id} />
          {label}
          {!signup && <ArrowRight size={16} />}
        </button>
      ))}
    </div>
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
