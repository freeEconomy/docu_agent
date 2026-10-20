'use client';
import { useState } from 'react';
import credits from '@/lib/forest/photo-credits.json';
export function Photo({
  photoId,
  alt,
  credit = false,
  priority = false,
}: {
  photoId: string;
  alt: string;
  credit?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const source = credits.find((c) => c.id === photoId);
  if (!source) return <p className="photo-missing">사진을 준비하고 있어요.</p>;
  return (
    <figure className={`english-photo ${photoId === 'window' ? 'photo-window' : ''}`}>
      {failed ? (
        <div className="photo-missing" role="status">
          사진을 불러오지 못했어요. 낱말과 문장으로 계속 배울 수 있어요.
        </div>
      ) : (
        <img
          src={source.local}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {credit && <figcaption>실제 촬영 사진 · CC0 · {source.author}</figcaption>}
    </figure>
  );
}
