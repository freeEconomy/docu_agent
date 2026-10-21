'use client';
import { BookOpen, Check, Search, X } from 'lucide-react';
import {
  tales,
  taleDifficulties,
  type Tale,
  type TaleDifficulty,
  type AdventureProgress,
} from '@/lib/forest/adventures';
import { StoryScene } from './shared';

export type BookFilter = { difficulty: 'all' | TaleDifficulty; query: string };
export function DifficultyBadge({ level }: { level: TaleDifficulty }) {
  const difficulty = taleDifficulties.find((item) => item.level === level)!;
  return (
    <span className={`book-difficulty level-${level}`}>
      <span aria-hidden="true">
        {'●'.repeat(level)}
        {'○'.repeat(3 - level)}
      </span>
      {difficulty.label}
    </span>
  );
}
export function Bookshop({
  progress,
  filter,
  onFilter,
  onSelect,
}: {
  progress: AdventureProgress;
  filter: BookFilter;
  onFilter: (filter: BookFilter) => void;
  onSelect: (tale: Tale) => void;
}) {
  const query = filter.query.trim().toLocaleLowerCase();
  const books = tales.filter(
    (book) =>
      (filter.difficulty === 'all' || book.difficulty === filter.difficulty) &&
      `${book.title} ${book.englishTitle} ${book.genre}`.toLocaleLowerCase().includes(query),
  );
  const completed = new Set(progress.activityRecords.map((record) => record.activityId));
  return (
    <section className="bookshop" aria-label="동화 서점">
      <div className="bookshop-welcome">
        <div>
          <span className="forest-eyebrow">YOUR LITTLE BOOKSHOP</span>
          <h2>오늘은 어떤 책을 펼쳐볼까요?</h2>
          <p>마음에 드는 표지를 골라요. 한 장면씩 읽다 보면 어느새 한 권!</p>
        </div>
        <div className="bookshop-stamp">
          <BookOpen size={26} />
          <strong>{tales.length}권</strong>
          <span>나만의 작은 서점</span>
        </div>
      </div>
      <div className="bookshop-tools">
        <div className="bookshop-levels" role="group" aria-label="동화 난이도">
          <button
            aria-pressed={filter.difficulty === 'all'}
            aria-label="난이도 전체"
            onClick={() => onFilter({ ...filter, difficulty: 'all' })}
          >
            전체 <span>{tales.length}</span>
          </button>
          {taleDifficulties.map((difficulty) => (
            <button
              key={difficulty.level}
              aria-label={`난이도 ${difficulty.label}`}
              aria-pressed={filter.difficulty === difficulty.level}
              onClick={() => onFilter({ ...filter, difficulty: difficulty.level })}
            >
              {difficulty.label}{' '}
              <span>{tales.filter((book) => book.difficulty === difficulty.level).length}</span>
            </button>
          ))}
        </div>
        <label className="bookshop-search">
          <Search size={18} aria-hidden="true" />
          <span className="bookshop-sr-only">동화 검색</span>
          <input
            type="search"
            value={filter.query}
            placeholder="읽고 싶은 책 찾기"
            onChange={(event) => onFilter({ ...filter, query: event.target.value })}
          />
        </label>
      </div>
      <div className="bookshop-guide">
        <p>
          {filter.difficulty === 'all'
            ? '쉬움부터 도전까지, 내 속도에 맞춰 골라요.'
            : taleDifficulties.find((item) => item.level === filter.difficulty)!.description}
        </p>
        <span role="status">{books.length}권 진열 중</span>
      </div>
      {books.length ? (
        <ul className="tale-library bookshop-grid" aria-label="동화 진열대">
          {books.map((book) => {
            const bookmark = progress.storyPages[book.id];
            const read = completed.has(`story:${book.id}`);
            return (
              <li className="bookshop-slot" key={book.id}>
                <button
                  className="tale-cover"
                  aria-label={`동화 읽기: ${book.title}`}
                  onClick={() => onSelect(book)}
                >
                  <div className="tale-cover-art" style={{ background: book.color }}>
                    <div className="book-cover-heading">
                      <span className="book-cover-genre">{book.genre}</span>
                      <h3>{book.title}</h3>
                      <span lang="en">{book.englishTitle}</span>
                    </div>
                    <StoryScene scene={book.pages[book.pages.length - 1]} compact />
                    {read && (
                      <span className="tale-read">
                        <Check size={13} />
                        완독
                      </span>
                    )}
                  </div>
                  <div className="book-cover-details">
                    <DifficultyBadge level={book.difficulty} />
                    <small>{book.pages.length}장면 · 영어·한국어</small>
                    <strong>
                      <BookOpen size={14} />
                      {bookmark === undefined
                        ? '책 펼치기'
                        : `이어 읽기 · ${bookmark + 1} / ${book.pages.length}`}
                    </strong>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bookshop-empty">
          <BookOpen size={36} />
          <h3>아직 이 책은 진열되지 않았어요</h3>
          <p>다른 제목으로 찾거나 모든 책을 펼쳐볼까요?</p>
          <button
            className="forest-button secondary"
            onClick={() => onFilter({ difficulty: 'all', query: '' })}
          >
            <X size={16} />
            모든 책 보기
          </button>
        </div>
      )}
      <p className="bookshop-footnote">
        난이도는 영어 문장 길이와 낱말을 기준으로 나눴어요. 어려우면 뜻 보기와 듣기를 함께 써
        보세요.
      </p>
    </section>
  );
}
