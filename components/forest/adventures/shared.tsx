'use client';
import { ArrowLeft, ArrowRight, Star, Trophy, Volume2 } from 'lucide-react';
import type { TalePage } from '@/lib/forest/adventures';

export function StoryScene({ scene, compact = false }: { scene: TalePage; compact?: boolean }) {
  return (
    <div
      className={`tale-scene theme-${scene.theme}${compact ? ' compact' : ''}`}
      role="img"
      aria-label={scene.caption}
    >
      <span className="tale-orb" aria-hidden="true">
        {scene.theme === 'night' ? '🌙' : '☀️'}
      </span>
      <span className="tale-cloud cloud-one" aria-hidden="true" />
      <span className="tale-cloud cloud-two" aria-hidden="true" />
      <span className="tale-hill hill-one" aria-hidden="true" />
      <span className="tale-hill hill-two" aria-hidden="true" />
      {scene.theme === 'bakery' && (
        <span className="tale-bakery" aria-hidden="true">
          BAKERY<span>🥖 🍞 🥐</span>
        </span>
      )}
      {scene.theme === 'night' && (
        <span className="tale-stars" aria-hidden="true">
          ✦ · ✧ · ✦
        </span>
      )}
      <span className="tale-tree" aria-hidden="true">
        {scene.theme === 'bakery' ? '🪴' : scene.theme === 'clouds' ? '☁️' : '🌳'}
      </span>
      <span className="tale-prop" aria-hidden="true">
        {scene.prop}
      </span>
      <div className="tale-cast" aria-hidden="true">
        {scene.cast.map((character, i) => (
          <span key={`${character}-${i}`} className={`cast-${i}`}>
            {character}
          </span>
        ))}
      </div>
      <span className="tale-flowers" aria-hidden="true">
        ✿ · ✿ · ✿
      </span>
    </div>
  );
}
export function AdventureHeading({
  eyebrow,
  title,
  description,
  onBack,
  backLabel = '메뉴로',
}: {
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="adventure-heading">
      {onBack && (
        <button className="adventure-back" onClick={onBack}>
          <ArrowLeft size={18} />
          {backLabel}
        </button>
      )}
      <span className="forest-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function AdventureComplete({
  title,
  score,
  earned,
  onAgain,
  onBack,
  story = false,
}: {
  title: string;
  score: number;
  earned: number;
  onAgain: () => void;
  onBack: () => void;
  story?: boolean;
}) {
  return (
    <section className="adventure-complete" aria-label="모험 완료">
      <div className="adventure-trophy" aria-hidden="true">
        <Trophy size={52} />
      </div>
      <span className="forest-eyebrow">YOU DID IT!</span>
      <h2>{title}</h2>
      <p>
        {story
          ? '한 권의 이야기를 끝까지 읽었어요. 멋진 마음을 기억해요!'
          : '차근차근 끝까지 해냈어요. 정말 멋져요!'}
      </p>
      {!story && (
        <>
          <strong className="adventure-score">
            {score}
            <small>점</small>
          </strong>
          <div
            className="run-score-stars"
            role="img"
            aria-label={`별 ${Math.max(1, Math.ceil(score / 20))}개`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={i < Math.max(1, Math.ceil(score / 20)) ? 'earned' : ''} />
            ))}
          </div>
        </>
      )}
      <div className="adventure-prize">
        {earned ? `오늘의 첫 완료 선물 +${earned} P` : '오늘의 완료 선물은 이미 받았어요'}
        <small>같은 동화·게임은 하루에 한 번 10포인트 · 다시 해도 포인트는 줄지 않아요</small>
      </div>
      <div className="forest-actions">
        <button className="forest-button secondary" onClick={onAgain}>
          {story ? '처음부터 다시 읽기' : '한 번 더 놀기'}
        </button>
        <button className="forest-button" onClick={onBack}>
          {story ? '다른 동화 보기' : '다른 게임 보기'}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
export function SpeakButton({
  text,
  speak,
  label = '듣기',
}: {
  text: string;
  speak: (text: string) => void;
  label?: string;
}) {
  return (
    <button className="forest-button secondary" onClick={() => speak(text)}>
      <Volume2 size={18} />
      {label}
    </button>
  );
}
