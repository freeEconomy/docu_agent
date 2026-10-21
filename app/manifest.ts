import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fun To Run',
    short_name: 'Fun To Run',
    description: '동화와 게임으로 즐겁게 배우는 생활 영어',
    lang: 'ko',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf8f2',
    theme_color: '#276449',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
