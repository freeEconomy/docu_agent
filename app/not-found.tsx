import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link className="button primary mt-5" href="/chat">
        워크스페이스로 이동
      </Link>
    </main>
  );
}
