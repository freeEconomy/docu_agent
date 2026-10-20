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
  title: '단어숲 — 실제 사진으로 배우는 생활 영어',
  description: 'CC0 실사 사진으로 사물 이름과 생활 영어 표현을 읽고 듣고 연습해요.',
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
