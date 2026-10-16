import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import './globals.css';
import { WorkspaceProvider } from '@/components/workspace-provider';
export const metadata: Metadata = {
  title: 'DocuMind — 문서 기반 AI 워크스페이스',
  description: 'DocuMind 문서 RAG 에이전트 프론트엔드 데모',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
