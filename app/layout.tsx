import type { Metadata, Viewport } from 'next';
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
  title: 'Fun To Run — 사진으로 배우는 생활 영어',
  description:
    '실사 사진으로 생활 영어를 배우고, 퀴즈 점수와 포인트를 모으며 나만의 학습 친구와 함께해요.',
  applicationName: 'Fun To Run',
  appleWebApp: {
    capable: true,
    title: 'Fun To Run',
    statusBarStyle: 'default',
  },
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};
export const viewport: Viewport = { themeColor: '#276449' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <RouteProvider>{children}</RouteProvider>
      </body>
    </html>
  );
}
