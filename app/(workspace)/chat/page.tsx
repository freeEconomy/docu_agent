import { Suspense } from 'react';
import { Chat } from '@/components/chat';
export default function ChatPage() {
  return (
    <Suspense fallback={<p className="p-8">워크스페이스 로딩 중...</p>}>
      <Chat />
    </Suspense>
  );
}
