'use client';
import { useEffect, useState } from 'react';
import { storyVideos } from '@/lib/forest/media';
export function StoryStage({ lesson, chapter = 0 }: { lesson: string; chapter?: number }) {
  const video = storyVideos[lesson]?.[chapter];
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [lesson, chapter]);
  if (video && !failed)
    return (
      <div className="forest-film">
        <video
          key={video.src}
          controls
          playsInline
          preload="none"
          poster={video.poster}
          onError={() => setFailed(true)}
          aria-label="동화 장면 영상"
        >
          {video.captions && (
            <track kind="captions" src={video.captions} srcLang="ko" label="한국어" default />
          )}
          <source src={video.src} type="video/mp4" />이 브라우저에서는 영상을 재생할 수 없습니다.
        </video>
        <p>장면을 본 뒤 글에서 인물의 선택을 찾아보세요.</p>
      </div>
    );
  return (
    <div className="forest-landscape">
      <svg viewBox="0 0 800 360" role="img" aria-label="숲과 언덕, 물길이 이어지는 탐험 풍경">
        <rect width="800" height="360" fill="#e4ebdf" />
        <circle cx="592" cy="82" r="37" fill="#e9c777" />
        <path d="M0 180 145 63 320 196 480 95 670 195 800 124V360H0Z" fill="#a6bca8" />
        <path d="M0 237Q140 145 320 231T800 193V360H0Z" fill="#6f9281" />
        <path d="M0 282Q213 191 490 276T800 240V360H0Z" fill="#345f50" />
        <path d="M450 225Q330 250 430 280T310 360H520Q610 300 510 277T510 225Z" fill="#c7dbd2" />
        <path
          d="M106 300V114m0 54-38-36m38 72 48-51m-48 85-56-38"
          fill="none"
          stroke="#28503d"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M690 312V147m0 55 35-31m-35 69-38-29"
          fill="none"
          stroke="#284c3b"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path d="m236 268 13-6 13 6m-13-6v17" fill="none" stroke="#e9d4a1" strokeWidth="3" />
        <circle cx="246" cy="251" r="5" fill="#e9d4a1" />
      </svg>
      <span>READ · DISCOVER · THINK</span>
      {failed && (
        <p role="status">영상을 불러오지 못했어요. 아래 글로 이야기를 계속 읽을 수 있어요.</p>
      )}
    </div>
  );
}
