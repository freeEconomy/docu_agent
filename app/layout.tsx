import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import './globals.css';
import { RouteProvider } from '@/components/route-provider';
export const metadata: Metadata = {
  title: '단어숲 — 하루 한 단어, 즐거운 배움',
  description: '단어와 문장, 동화와 퀴즈를 학습 친구와 함께 만나요.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <RouteProvider>{children}</RouteProvider>
      </body>
    </html>
  );
}
