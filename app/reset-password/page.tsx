'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { readableError } from '@/lib/documents';
import { AuthHeader, AuthFooter } from '@/components/auth';
export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="auth-page">
      <AuthHeader />
      <main className="page-content">
        <form
          className="card p-6 max-w-lg mx-auto"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!ready) return;
            if (password !== confirm) {
              setMessage('비밀번호가 일치하지 않습니다.');
              return;
            }
            setBusy(true);
            const { error } = await getSupabase().auth.updateUser({ password });
            setBusy(false);
            if (error) setMessage(readableError(error));
            else {
              setMessage('비밀번호를 변경했습니다.');
              router.replace('/chat');
            }
          }}
        >
          <h1>비밀번호 재설정</h1>
          <p className="muted mt-4">재설정 이메일의 링크로 접속한 뒤 새 비밀번호를 입력하세요.</p>
          <label className="field mt-5">
            새 비밀번호
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="field mt-5">
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button className="button primary mt-5" disabled={!ready || busy}>
            비밀번호 변경
          </button>
          {message && (
            <p role="status" className="mt-4">
              {message}
            </p>
          )}
        </form>
      </main>
      <AuthFooter />
    </div>
  );
}
