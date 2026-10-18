'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/client';
import { readableError } from '@/lib/documents';
import { AuthHeader, AuthFooter } from '@/components/auth';
import { useWorkspace } from '@/components/workspace-provider';
export default function ChangePassword() {
  const { session, hydrated } = useWorkspace();
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="page-content">
        <form
          className="card p-6 max-w-lg mx-auto"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setMessage('비밀번호가 일치하지 않습니다.');
              return;
            }
            setBusy(true);
            try {
              await apiRequest('/api/auth/password', { currentPassword, password });
              setMessage('비밀번호를 변경했습니다. 다른 로그인 세션은 종료되었습니다.');
              setCurrent('');
              setPassword('');
              setConfirm('');
            } catch (error) {
              setMessage(readableError(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h1>비밀번호 변경</h1>
          {hydrated && !session ? (
            <p className="mt-5">
              로그인 후 비밀번호를 변경할 수 있습니다.{' '}
              <Link className="text-primary" href="/login">
                로그인
              </Link>
            </p>
          ) : (
            <>
              <label className="field mt-5">
                현재 비밀번호
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={currentPassword}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </label>
              <label className="field mt-5">
                새 비밀번호
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="field mt-5">
                비밀번호 확인
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              <button className="button primary mt-5" disabled={busy}>
                비밀번호 변경
              </button>
            </>
          )}
          {message && (
            <p className="mt-4" role="status">
              {message}
            </p>
          )}
        </form>
      </main>
      <AuthFooter />
    </div>
  );
}
