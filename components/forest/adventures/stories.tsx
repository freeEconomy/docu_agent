'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, RotateCcw } from 'lucide-react';
import { tales, type ActivityId, type AdventureProgress } from '@/lib/forest/adventures';
import { words } from '@/lib/forest/content';
import { StoryScene, AdventureHeading, AdventureComplete, SpeakButton } from './shared';
export function StoryLibrary({
  progress,
  speak,
  stop,
  onBookmark,
  onComplete,
  onWord,
}: {
  progress: AdventureProgress;
  speak: (text: string) => void;
  stop: () => void;
  onBookmark: (id: string, page: number) => void;
  onComplete: (id: ActivityId, score: number) => number;
  onWord: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [page, setPage] = useState(0),
    [translated, setTranslated] = useState(true),
    [earned, setEarned] = useState<number | null>(null);
  const finished = useRef(false);
  const tale = tales.find((t) => t.id === selected);
  const goPage = (n: number) => {
    if (!tale) return;
    stop();
    window.scrollTo({ top: 0 });
    setPage(n);
    onBookmark(tale.id, n);
  };
  const library = () => {
    stop();
    window.scrollTo({ top: 0 });
    setSelected(null);
    setEarned(null);
    finished.current = false;
  };
  if (!tale)
    return (
      <>
        <AdventureHeading
          eyebrow="LITTLE STORIES · BIG HEARTS"
          title="두근두근 동화책장"
          description="친구들과 떠나는 작은 모험. 읽고, 듣고, 따뜻한 말을 배워요."
        />
        <div className="tale-library">
          {tales.map((book, i) => {
            const completed = progress.activityRecords.some(
              (r) => r.activityId === `story:${book.id}`,
            );
            const bookmark = progress.storyPages[book.id];
            return (
              <button
                key={book.id}
                className="tale-cover"
                onClick={() => {
                  stop();
                  finished.current = false;
                  setEarned(null);
                  window.scrollTo({ top: 0 });
                  setSelected(book.id);
                  setPage(bookmark ?? 0);
                  onBookmark(book.id, bookmark ?? 0);
                }}
                aria-label={`동화 읽기: ${book.title}`}
              >
                <div className="tale-cover-art" style={{ background: book.color }}>
                  <StoryScene scene={book.pages[book.pages.length - 1]} compact />
                  <span className="tale-volume">STORY {String(i + 1).padStart(2, '0')}</span>
                  {completed && (
                    <span className="tale-read">
                      <Check size={15} />
                      완독
                    </span>
                  )}
                </div>
                <div className="tale-cover-copy">
                  <span className="tale-badge">{book.badge}</span>
                  <h2>{book.title}</h2>
                  <p>{book.description}</p>
                  <small>
                    {book.spooky && '살짝 오싹 · '}
                    {book.pages.length}장면 · 한국어 뜻 · 영어 듣기
                  </small>
                  <strong>
                    <BookOpen size={17} />
                    {bookmark === undefined
                      ? '책 펼치기'
                      : `이어 읽기 · ${bookmark + 1} / ${book.pages.length}`}
                    <ArrowRight size={17} />
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
        <div className="adventure-note">
          모두 Fun To Run의 창작 동화예요. 한 장면씩 천천히 읽어도 괜찮아요. 영어 소리가 없어도 글과
          뜻으로 함께 읽을 수 있어요.
        </div>
      </>
    );
  const scene = tale.pages[page],
    word = words.find((w) => w.id === scene.wordId)!;
  return (
    <>
      <AdventureHeading
        eyebrow={tale.englishTitle.toUpperCase()}
        title={tale.title}
        description=""
        onBack={library}
        backLabel="동화책장"
      />
      {earned !== null ? (
        <AdventureComplete
          title={`${tale.badge}을 찾았어요!`}
          story
          score={100}
          earned={earned}
          onAgain={() => {
            finished.current = false;
            setEarned(null);
            goPage(0);
          }}
          onBack={library}
        />
      ) : (
        <article className="tale-reader">
          <div className="tale-reader-top">
            <span>
              <BookOpen size={17} /> {page + 1} / {tale.pages.length}장면
            </span>
            <button onClick={() => goPage(0)}>
              <RotateCcw size={16} />
              처음부터
            </button>
          </div>
          <StoryScene scene={scene} />
          <div className="tale-reader-text" aria-live="polite">
            <p lang="en">{scene.english}</p>
            {translated && <p className="tale-translation">{scene.korean}</p>}
            <div className="forest-actions">
              <SpeakButton text={scene.english} speak={speak} label="이 장면 듣기" />
              <button className="forest-button secondary" onClick={() => setTranslated((v) => !v)}>
                <Eye size={17} />
                {translated ? '뜻 숨기기' : '뜻 보기'}
              </button>
            </div>
          </div>
          <div className="tale-word">
            <span>이야기 속 영어</span>
            <button
              onClick={() => {
                stop();
                onWord(word.id);
              }}
            >
              <strong lang="en">{word.name}</strong>
              <span>{word.korean}</span>
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="tale-pagination">
            <button
              className="forest-button secondary"
              disabled={page === 0}
              onClick={() => goPage(page - 1)}
            >
              <ArrowLeft size={18} />
              이전 장면
            </button>
            <span aria-label={`읽기 진행 ${page + 1}/${tale.pages.length}`}>
              {tale.pages.map((_, i) => (
                <i key={i} className={i <= page ? 'filled' : ''} />
              ))}
            </span>
            {page < tale.pages.length - 1 ? (
              <button className="forest-button" onClick={() => goPage(page + 1)}>
                다음 장면
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className="forest-button"
                onClick={() => {
                  if (finished.current) return;
                  finished.current = true;
                  stop();
                  setEarned(onComplete(`story:${tale.id}`, 100));
                }}
              >
                이야기 완료
                <Check size={18} />
              </button>
            )}
          </div>
        </article>
      )}
    </>
  );
}
