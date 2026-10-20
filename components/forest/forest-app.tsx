'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Home,
  BookOpen,
  BookHeart,
  Puzzle,
  Smile,
  Volume2,
  VolumeX,
  Lock,
  Search,
  ArrowRight,
  ArrowLeft,
  Leaf,
  Star,
  Check,
  RotateCcw,
  X,
  ChevronRight,
} from 'lucide-react';
import { categories, findWord, makeQuiz, words, type Word } from '@/lib/forest/content';
import './forest.css';
import { StoryStage } from './story-stage';
type View = 'home' | 'word' | 'story' | 'quiz' | 'result' | 'character' | 'parent';
type RecordEntry = {
  word: string;
  date: string;
  firstTry: number;
  total?: number;
  review: boolean;
};
type Profile = {
  name: string;
  animal: 'rabbit' | 'bear' | 'cat';
  color: string;
  hat: string;
  level: number;
  rate: number;
  goal: number;
  leaves: number;
  records: RecordEntry[];
  learned: string[];
  selected: string;
  storyPage: number;
};
const key = 'wordforest-v1';
const initial: Profile = {
  name: '새싹',
  animal: 'rabbit',
  color: '#b9dca8',
  hat: '없음',
  level: 1,
  rate: 0.85,
  goal: 10,
  leaves: 0,
  records: [],
  learned: [],
  selected: 'apple',
  storyPage: 0,
};
function loadProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') throw Error('invalid');
  const p = value as Profile;
  if (
    typeof p.name !== 'string' ||
    p.name.length > 8 ||
    !['rabbit', 'bear', 'cat'].includes(p.animal) ||
    !['#b9dca8', '#f8d298', '#d6bce8'].includes(p.color) ||
    !['없음', '꽃', '왕관', '모자'].includes(p.hat) ||
    ![0, 1, 2].includes(p.level) ||
    ![0.65, 0.85, 1].includes(p.rate) ||
    ![5, 10, 15, 20].includes(p.goal) ||
    !Number.isInteger(p.leaves) ||
    p.leaves < 0 ||
    !Array.isArray(p.records) ||
    !Array.isArray(p.learned) ||
    !words.some((w) => w.id === p.selected) ||
    !Number.isInteger(p.storyPage) ||
    p.storyPage < 0 ||
    p.storyPage >= (words.find((w) => w.id === p.selected)?.story.pages.length || 0)
  )
    throw Error('invalid');
  const records = p.records
    .filter(
      (r) =>
        r &&
        words.some((w) => w.id === r.word) &&
        typeof r.date === 'string' &&
        Number.isInteger(r.firstTry) &&
        r.firstTry >= 0 &&
        r.firstTry <= (r.total ?? 3) &&
        [3, 5].includes(r.total ?? 3) &&
        typeof r.review === 'boolean',
    )
    .slice(-300);
  return { ...p, records, learned: p.learned.filter((id) => words.some((w) => w.id === id)) };
}
function Avatar({
  profile,
  large = false,
}: {
  profile: Pick<Profile, 'animal' | 'color' | 'hat'>;
  large?: boolean;
}) {
  const { animal, color, hat } = profile;
  return (
    <svg
      className={`forest-avatar ${large ? 'large' : ''}`}
      viewBox="0 0 240 260"
      role="img"
      aria-label={`${animal === 'rabbit' ? '토끼' : animal === 'bear' ? '곰' : '고양이'} 친구, ${hat}`}
    >
      <ellipse cx="120" cy="238" rx="73" ry="12" fill="#d5dfc7" />
      <ellipse cx="120" cy="195" rx="51" ry="48" fill={color} />
      <ellipse cx="120" cy="201" rx="31" ry="30" fill="#fff9ef" />
      {animal === 'rabbit' ? (
        <>
          <ellipse cx="83" cy="64" rx="24" ry="57" transform="rotate(-12 83 64)" fill={color} />
          <ellipse cx="158" cy="64" rx="24" ry="57" transform="rotate(12 158 64)" fill={color} />
          <ellipse cx="83" cy="61" rx="11" ry="37" transform="rotate(-12 83 61)" fill="#f8d0c4" />
          <ellipse cx="158" cy="61" rx="11" ry="37" transform="rotate(12 158 61)" fill="#f8d0c4" />
        </>
      ) : animal === 'bear' ? (
        <>
          <circle cx="68" cy="73" r="29" fill={color} />
          <circle cx="174" cy="73" r="29" fill={color} />
          <circle cx="68" cy="73" r="16" fill="#fff1d8" />
          <circle cx="174" cy="73" r="16" fill="#fff1d8" />
        </>
      ) : (
        <>
          <path
            d="M49 104 47 40 100 74M140 74 193 40 190 110"
            fill={color}
            stroke={color}
            strokeWidth="10"
            strokeLinejoin="round"
          />
        </>
      )}
      <ellipse cx="120" cy="123" rx="78" ry="65" fill={color} />
      <ellipse cx="120" cy="143" rx="33" ry="24" fill="#fff9ef" />
      <circle cx="91" cy="119" r="5" fill="#3a392a" />
      <circle cx="151" cy="119" r="5" fill="#3a392a" />
      <ellipse cx="72" cy="137" rx="12" ry="7" fill="#efb5a0" />
      <ellipse cx="170" cy="137" rx="12" ry="7" fill="#efb5a0" />
      <path d="m113 135 7 6 7-6Z" fill="#625042" />
      <path
        d="M120 142q-8 13-16 1m16-1q8 13 16 1"
        fill="none"
        stroke="#625042"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="78" cy="230" rx="24" ry="11" fill={color} />
      <ellipse cx="161" cy="230" rx="24" ry="11" fill={color} />
      {hat !== '없음' && (
        <text x="120" y="83" textAnchor="middle" fontSize="55">
          {hat === '꽃' ? '🌼' : hat === '왕관' ? '👑' : '🧢'}
        </text>
      )}
    </svg>
  );
}
export function ForestApp() {
  const [profile, setProfile] = useState<Profile>(initial),
    [ready, setReady] = useState(false),
    [view, setView] = useState<View>('home');
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('전체'),
    [missing, setMissing] = useState(''),
    [notice, setNotice] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [speaking, setSpeaking] = useState(false),
    [sound, setSound] = useState(true);
  const [quizIndex, setQuizIndex] = useState(0),
    [choice, setChoice] = useState(''),
    [hint, setHint] = useState(false),
    [wrong, setWrong] = useState(false),
    [exam, setExam] = useState(false),
    [answers, setAnswers] = useState<{ answer: string; first: boolean }[]>([]);
  const [gate, setGate] = useState(false),
    [gateAnswer, setGateAnswer] = useState(''),
    [gateError, setGateError] = useState(false),
    [gateNumbers, setGateNumbers] = useState([12, 7]),
    [confirm, setConfirm] = useState(false);
  const [draft, setDraft] = useState(initial),
    [saved, setSaved] = useState(false);
  const [sentenceVariant, setSentenceVariant] = useState(false);
  const [focusTerm, setFocusTerm] = useState('');
  const completed = useRef(false);
  const lastNameCode = profile.name.charCodeAt(profile.name.length - 1);
  const callName = `${profile.name}${lastNameCode >= 0xac00 && lastNameCode <= 0xd7a3 && (lastNameCode - 0xac00) % 28 !== 0 ? '아' : '야'}`;
  const word = words.find((w) => w.id === profile.selected) || words[0];
  const questions = makeQuiz(word);
  const question = questions[quizIndex];
  const sentence = (sentenceVariant ? word.alternate : word.sentences)[profile.level];
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setProfile(loadProfile(JSON.parse(raw)));
    } catch {
      setNotice('저장된 기록을 읽지 못했어요. 새로 시작할 수 있어요.');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(profile));
      } catch {
        setNotice('기기에 저장하지 못했어요. 저장 공간과 브라우저 설정을 확인해 주세요.');
      }
  }, [profile, ready]);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const sync = () => setVoices(window.speechSynthesis.getVoices());
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', sync);
      window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    window.scrollTo({ top: 0 });
  }, [view, profile.selected, profile.storyPage]);
  function speak(text: string) {
    if (!sound) {
      setNotice('소리가 꺼져 있어요. 위쪽 소리 버튼을 눌러 주세요.');
      return;
    }
    const voice = voices.find((v) => /^ko(?:-|_)/i.test(v.lang));
    if (!('speechSynthesis' in window) || !voice) {
      setNotice(
        '이 기기에 한국어 읽기 목소리가 없어요. 기기 설정에서 한국어 음성을 추가하거나 글로 읽어 주세요.',
      );
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.voice = voice;
    u.rate = profile.rate;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => {
      setSpeaking(false);
      setNotice('소리를 재생하지 못했어요. 다시 눌러 주세요.');
    };
    window.speechSynthesis.speak(u);
  }
  function go(next: View) {
    setView(next);
    setMissing('');
    setSaved(false);
    if (next === 'character') setDraft(profile);
    if (next === 'quiz') startQuiz();
  }
  function selectWord(w: Word, next: View = 'word') {
    setProfile((p) => ({ ...p, selected: w.id, storyPage: 0 }));
    setMissing('');
    setFocusTerm('');
    setSentenceVariant(false);
    setSearch('');
    setView(next);
    if (next === 'quiz') startQuiz();
  }
  function searchWord(e: React.FormEvent) {
    e.preventDefault();
    const found = findWord(search);
    if (found) {
      selectWord(found);
      setFocusTerm(found.glossary.find((g) => g.term === search.trim())?.term || '');
    } else
      setMissing(
        search.trim()
          ? '이 단어는 아직 준비 중이야. 아래 단어를 만나 볼까?'
          : '찾고 싶은 단어를 입력해 줘.',
      );
  }
  function startQuiz() {
    setQuizIndex(0);
    setAnswers([]);
    setChoice('');
    setWrong(false);
    setHint(false);
    completed.current = false;
  }
  function pick(answer: string) {
    if (choice && !exam && choice === question.answer) return;
    setChoice(answer);
    if (!exam && answer !== question.answer) setWrong(true);
  }
  function nextQuiz() {
    if (!choice || (!exam && choice !== question.answer)) return;
    const next = [...answers, { answer: choice, first: !wrong && choice === question.answer }];
    setAnswers(next);
    if (quizIndex < questions.length - 1) {
      setQuizIndex((i) => i + 1);
      setChoice('');
      setWrong(false);
      setHint(false);
      return;
    }
    if (!completed.current) {
      completed.current = true;
      const firstTry = next.filter((a) => a.first).length;
      const date = new Date().toISOString();
      const review = firstTry < questions.length;
      setProfile((p) => {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
        const rewarded = p.records.some(
          (r) =>
            r.word === word.id &&
            new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) === today,
        );
        return {
          ...p,
          leaves: p.leaves + (rewarded ? 0 : 10),
          learned: [...new Set([...p.learned, word.id])],
          records: [
            ...p.records,
            { word: word.id, date, firstTry, total: questions.length, review },
          ].slice(-300),
        };
      });
    }
    setView('result');
  }
  function openParent() {
    setGateNumbers([Math.floor(Math.random() * 9) + 11, Math.floor(Math.random() * 8) + 3]);
    setGateAnswer('');
    setGateError(false);
    setGate(true);
  }
  function saveCharacter() {
    setProfile((p) => ({
      ...p,
      name: draft.name.trim() || '새싹',
      animal: draft.animal,
      color: draft.color,
      hat: draft.hat,
    }));
    setSaved(true);
  }
  const nav = [
    { id: 'home', label: '홈', Icon: Home },
    { id: 'word', label: '단어배우기', Icon: BookOpen },
    { id: 'story', label: '동화마을', Icon: BookHeart },
    { id: 'quiz', label: '놀이퀴즈', Icon: Puzzle },
    { id: 'character', label: '친구꾸미기', Icon: Smile },
  ] as const;
  const latestReview = [...new Map(profile.records.map((r) => [r.word, r])).values()].filter(
    (r) => r.review,
  );
  return (
    <div className="forest-app">
      <header className="forest-header">
        <button className="forest-brand" onClick={() => go('home')} aria-label="단어숲 홈">
          🌲 <span>단어숲</span>
        </button>
        <div className="forest-header-tools">
          <button
            className="forest-icon"
            aria-label={sound ? '소리 끄기' : '소리 켜기'}
            onClick={() => {
              setSound(!sound);
              window.speechSynthesis?.cancel();
              setSpeaking(false);
            }}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <span className="forest-leaves">
            <Leaf size={18} /> <span>나뭇잎</span> {profile.leaves}개
          </span>
          <button className="forest-parent-link" aria-label="부모님" onClick={openParent}>
            <Lock size={16} />
            <span>부모님</span>
          </button>
        </div>
      </header>
      {notice && (
        <div className="forest-notice" role="status">
          {notice}
          <button aria-label="안내 닫기" onClick={() => setNotice('')}>
            <X size={18} />
          </button>
        </div>
      )}
      <main className="forest-main" aria-busy={!ready}>
        {view === 'home' && (
          <>
            <div className="forest-banner">
              <span>🌿 준비된 이야기로 차근차근, 즐겁게 배워요</span>
              <span className="forest-pill">우리들의 배움터</span>
            </div>
            <section className="forest-hero">
              <div className="forest-hero-copy">
                <span className="forest-eyebrow">7세 읽기 탐험 · 어휘에서 생각까지</span>
                <h1>
                  안녕 {callName}! 🌿
                  <br />
                  어떤 <em>단어</em>랑 놀아볼까?
                </h1>
                <p>낱말을 넓히고, 이야기 속 까닭을 찾아봐!</p>
                <button
                  className="forest-listen"
                  onClick={() => speak(`안녕 ${profile.name}! 오늘은 어떤 단어와 놀까?`)}
                >
                  <Volume2 size={19} /> 인사 듣기
                </button>
              </div>
              <div className="forest-hero-expedition">
                <StoryStage lesson={word.id} />
                <span className="forest-expedition-tag">7세 · 이야기 탐험대</span>
              </div>
            </section>
            <form className="forest-search" onSubmit={searchWord}>
              <Search />
              <input
                aria-label="단어 찾기"
                placeholder="궁금한 단어를 적어 봐!"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={30}
                list="forest-words"
              />
              <button className="forest-button" type="submit">
                찾기 <ArrowRight size={18} />
              </button>
            </form>
            <datalist id="forest-words">
              {words.map((w) => (
                <option key={w.id} value={w.name} />
              ))}
            </datalist>
            {missing && (
              <p role="status" className="forest-empty">
                {missing}
              </p>
            )}
            <div className="forest-quick">
              <span>이 단어는 어때?</span>
              {words.slice(0, 4).map((w) => (
                <button key={w.id} onClick={() => selectWord(w)}>
                  {w.emoji} {w.name}
                </button>
              ))}
            </div>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">TODAY'S LITTLE DISCOVERY</span>
                <h2>오늘의 어휘 탐험</h2>
              </div>
              <span className="forest-pill yellow">✨ 새로운 발견</span>
            </div>
            <section className="forest-daily">
              <div className="forest-word-picture">
                🍎<span>수확 · 탐스럽다</span>
              </div>
              <div>
                <h2>사과</h2>
                <p>{words[0].meaning}</p>
                <button className="forest-button" onClick={() => selectWord(words[0])}>
                  사과 단어 배우러 가기 <ArrowRight size={18} />
                </button>
              </div>
              <button
                className="forest-icon"
                aria-label="사과 뜻 듣기"
                onClick={() => speak(words[0].meaning)}
              >
                <Volume2 />
              </button>
            </section>
            <div className="forest-heading">
              <div>
                <h2>주제별 탐험 놀이터</h2>
                <p>좋아하는 모험 길을 골라 보세요!</p>
              </div>
              <span className="forest-muted">준비된 단어 {words.length}개</span>
            </div>
            <div className="forest-category-tabs">
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? 'selected' : ''}
                  onClick={() => setCategory(c)}
                >
                  {c === '전체' ? '모두 보기' : c}
                </button>
              ))}
            </div>
            <div className="forest-word-grid">
              {words
                .filter((w) => category === '전체' || w.category === category)
                .map((w) => (
                  <button
                    className={`forest-word-card ${w.category === '동물' ? 'peach' : w.category === '자연' ? 'green' : w.category === '생활' ? 'purple' : 'yellow'}`}
                    key={w.id}
                    onClick={() => selectWord(w)}
                  >
                    <span>{w.emoji}</span>
                    <strong>{w.name}</strong>
                    <small>
                      {w.category} 친구 {profile.learned.includes(w.id) && '· 배웠어요 ✓'}
                    </small>
                  </button>
                ))}
            </div>
            <section className="forest-continue">
              <span>📖</span>
              <div>
                <small>이어서 읽기</small>
                <h3>{word.story.title}</h3>
                <p>{word.name}와 함께 이야기 속으로 떠나요.</p>
              </div>
              <button onClick={() => go('story')} className="forest-button secondary">
                동화 보기 <ChevronRight size={18} />
              </button>
            </section>
          </>
        )}
        {view === 'word' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">한 단어씩, 새로운 세상</span>
                <h1>단어 배우기</h1>
              </div>
              <button className="forest-button secondary" onClick={() => go('home')}>
                <Search size={18} /> 다른 단어
              </button>
            </div>
            <section className="forest-word-detail">
              <span className="forest-pill">{word.category} 친구</span>
              <div className="forest-big-emoji">{word.emoji}</div>
              <h2>{word.name}</h2>
              <p>{word.meaning}</p>
              <button
                className="forest-button"
                onClick={() => speak(`${word.name}. ${word.meaning}`)}
              >
                <Volume2 size={20} /> 단어 듣기
              </button>
              <div className="forest-related">
                {word.related.map((r) => (
                  <button key={r} onClick={() => setFocusTerm(r)} aria-pressed={focusTerm === r}>
                    🌱 {r}
                  </button>
                ))}
              </div>
            </section>
            <section className="forest-glossary" aria-label="확장 어휘 사전">
              <div className="forest-heading">
                <h2>함께 넓히는 어휘 가지</h2>
                <span className="forest-pill">7세 생각 국어</span>
              </div>
              {word.glossary.map((g) => (
                <button
                  key={g.term}
                  className={focusTerm === g.term ? 'selected' : ''}
                  onClick={() => {
                    setFocusTerm(g.term);
                    speak(`${g.term}. ${g.meaning}`);
                  }}
                >
                  <strong>{g.term}</strong>
                  <span>{g.meaning}</span>
                  <Volume2 size={18} />
                </button>
              ))}
            </section>
            <div className="forest-heading">
              <h2>문장으로 만나 볼까?</h2>
              <div className="forest-category-tabs">
                {['탄탄 읽기', '생각 읽기', '도전 읽기'].map((l, i) => (
                  <button
                    key={l}
                    aria-pressed={profile.level === i}
                    className={profile.level === i ? 'selected' : ''}
                    onClick={() => setProfile((p) => ({ ...p, level: i }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <section className="forest-sentence">
              <span className="forest-pill">
                {['꾸밈말을 살펴요', '일의 원인과 결과', '조건과 마음을 생각해요'][profile.level]}
              </span>
              <p>{sentence}</p>
              <div className="forest-actions">
                <button className="forest-button" onClick={() => speak(sentence)}>
                  <Volume2 size={19} /> 문장 듣기
                </button>
                <button
                  className="forest-button secondary"
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setSpeaking(false);
                    setSentenceVariant((v) => !v);
                  }}
                >
                  다른 문장 <RotateCcw size={16} />
                </button>
                <button
                  className="forest-button secondary"
                  onClick={() => setProfile((p) => ({ ...p, rate: p.rate === 0.65 ? 0.85 : 0.65 }))}
                >
                  {profile.rate === 0.65 ? '기본 속도' : '느리게 듣기'}
                </button>
                <button
                  className="forest-icon"
                  aria-label="읽기 정지"
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setSpeaking(false);
                  }}
                >
                  <VolumeX />
                </button>
              </div>
              {speaking && (
                <p className="forest-muted" role="status">
                  소리 내어 읽고 있어요…
                </p>
              )}
            </section>
            <div className="forest-bottom-actions">
              <button className="forest-button secondary" onClick={() => go('quiz')}>
                <Puzzle size={20} /> 단어 퀴즈
              </button>
              <button className="forest-button" onClick={() => go('story')}>
                동화 읽으러 가기 <ArrowRight size={20} />
              </button>
            </div>
          </>
        )}
        {view === 'story' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">{profile.name}의 이야기 시간</span>
                <h1>{word.story.title}</h1>
              </div>
              <span className="forest-pill">
                {profile.storyPage + 1} / {word.story.pages.length}쪽
              </span>
            </div>
            <div
              className="forest-progress"
              role="progressbar"
              aria-label="동화 읽기 진행"
              aria-valuenow={profile.storyPage + 1}
              aria-valuemin={0}
              aria-valuemax={word.story.pages.length}
            >
              <span
                style={{ width: `${((profile.storyPage + 1) / word.story.pages.length) * 100}%` }}
              />
            </div>
            <section className="forest-story">
              <StoryStage lesson={word.id} chapter={profile.storyPage} />
              <div className="forest-story-copy">
                <span className="forest-chapter">
                  {
                    [
                      '발단 · 모험의 시작',
                      '문제 · 무슨 일이 생겼을까?',
                      '탐색 · 단서를 찾아서',
                      '전환 · 다른 방법을 생각해',
                      '해결 · 함께 풀어 가요',
                      '성장 · 달라진 마음',
                    ][profile.storyPage]
                  }
                </span>
                <span className="forest-pill">🌱 주인공: {profile.name}</span>
                <p>{word.story.pages[profile.storyPage].replaceAll('{name}', profile.name)}</p>
                <div className="forest-actions">
                  <button
                    className="forest-button secondary"
                    onClick={() =>
                      speak(word.story.pages[profile.storyPage].replaceAll('{name}', profile.name))
                    }
                  >
                    <Volume2 size={19} /> 이 쪽 듣기
                  </button>
                  <button
                    className="forest-icon"
                    aria-label="동화 읽기 정지"
                    onClick={() => {
                      window.speechSynthesis?.cancel();
                      setSpeaking(false);
                    }}
                  >
                    <VolumeX />
                  </button>
                </div>
              </div>
            </section>
            <div className="forest-story-navigation">
              <button
                className="forest-button secondary"
                disabled={profile.storyPage === 0}
                onClick={() => setProfile((p) => ({ ...p, storyPage: p.storyPage - 1 }))}
              >
                <ArrowLeft size={18} /> 이전 쪽
              </button>
              {profile.storyPage < word.story.pages.length - 1 ? (
                <button
                  className="forest-button"
                  onClick={() => setProfile((p) => ({ ...p, storyPage: p.storyPage + 1 }))}
                >
                  다음 쪽 읽기 <ArrowRight size={18} />
                </button>
              ) : (
                <button className="forest-button" onClick={() => go('quiz')}>
                  이야기 퀴즈 풀기 <Puzzle size={18} />
                </button>
              )}
            </div>
            {profile.storyPage === word.story.pages.length - 1 && (
              <section className="forest-thinking">
                <span>💭 정답이 하나가 아닌 질문</span>
                <h2>{word.story.thinking}</h2>
                <p>내 생각을 말해 보고, 왜 그렇게 생각했는지도 이야기해 보세요.</p>
              </section>
            )}
            <aside className="forest-tip">
              💡 마지막 쪽까지 읽으면 이야기 퀴즈를 풀 수 있어요. 모르는 단어는 다시 만나도
              괜찮아요!
            </aside>
          </>
        )}
        {view === 'quiz' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">틀려도 괜찮아, 같이 생각해 보자!</span>
                <h1>{exam ? '복습 도전' : '오늘의 놀이 퀴즈'}</h1>
              </div>
              <span className="forest-pill">
                {quizIndex + 1} / {questions.length}문제
              </span>
            </div>
            {quizIndex === 0 && answers.length === 0 && (
              <div className="forest-category-tabs">
                <button
                  className={!exam ? 'selected' : ''}
                  onClick={() => {
                    setExam(false);
                    startQuiz();
                  }}
                >
                  연습 · 바로 확인
                </button>
                <button
                  className={exam ? 'selected' : ''}
                  onClick={() => {
                    setExam(true);
                    startQuiz();
                  }}
                >
                  복습 · 마지막에 확인
                </button>
              </div>
            )}
            <div className="forest-progress">
              <span style={{ width: `${(quizIndex / questions.length) * 100}%` }} />
            </div>
            <section className="forest-quiz-question">
              <span className="forest-big-emoji">{question.visual}</span>
              <span className="forest-pill">
                {['어휘 뜻', '문맥 속 낱말', '이유 찾기', '사건 순서', '생각과 추론'][quizIndex]}
              </span>
              <h2>{question.question}</h2>
              {question.sentence && <p className="forest-blank">{question.sentence}</p>}
              <button className="forest-listen" onClick={() => speak(question.question)}>
                <Volume2 size={18} /> 문제 듣기
              </button>
            </section>
            <div className="forest-choices">
              {question.options.map((option) => (
                <button
                  key={option}
                  className={`forest-choice ${choice === option ? (exam ? 'chosen' : option === question.answer ? 'correct' : 'try-again') : ''}`}
                  onClick={() => pick(option)}
                  aria-pressed={choice === option}
                >
                  <span>{words.find((w) => w.name === option)?.emoji || '🌱'}</span>
                  <strong>{option}</strong>
                  {choice === option && <Check />}
                </button>
              ))}
            </div>
            {!exam && (
              <>
                <button className="forest-hint" onClick={() => setHint(!hint)}>
                  💡 {hint ? '힌트 접기' : '힌트가 궁금해? 눌러 봐!'}
                </button>
                {hint && <p className="forest-tip">{question.hint}</p>}
                {choice && (
                  <div
                    className={`forest-feedback ${choice === question.answer ? 'success' : ''}`}
                    role="status"
                  >
                    {choice === question.answer
                      ? `✨ 잘 생각했어요! ${question.explanation}`
                      : '🌱 괜찮아! 힌트를 보고 다시 생각해 보자.'}
                  </div>
                )}
              </>
            )}
            <div className="forest-bottom-actions">
              <span className="forest-muted">시간 제한 없이 천천히 풀어요.</span>
              <button
                className="forest-button"
                disabled={!choice || (!exam && choice !== question.answer)}
                onClick={nextQuiz}
              >
                {quizIndex === questions.length - 1 ? '학습 결과 보기' : '다음 문제'}{' '}
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
        {view === 'result' && (
          <>
            <section className="forest-result">
              <div className="forest-result-icon">🌟</div>
              <span className="forest-pill">오늘도 한 뼘 자랐어요</span>
              <h1>{callName}, 끝까지 해냈구나!</h1>
              <p>
                <strong>{word.name}</strong>의 뜻과 문장, 이야기를 만나 보았어요.
              </p>
              <div className="forest-result-stats">
                <div>
                  <strong>
                    {answers.filter((a) => a.first).length} / {questions.length}
                  </strong>
                  <span>처음에 맞힌 문제</span>
                </div>
                <div>
                  <strong>🍃 {profile.leaves}</strong>
                  <span>모은 나뭇잎</span>
                </div>
              </div>
              <p className="forest-muted">단어마다 하루 첫 퀴즈 완료 시 나뭇잎 10개를 받아요.</p>
              <div className="forest-review-list">
                {questions.map((q, i) => (
                  <div key={q.question}>
                    <span>{answers[i]?.first ? '🌼' : '🌱'}</span>
                    <div>
                      <strong>{q.question}</strong>
                      <p>정답: {q.answer}</p>
                      <p className="forest-answer-explanation">{q.explanation}</p>
                      {!answers[i]?.first && <small>다시 만나며 익혀 봐요.</small>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="forest-actions">
                <button className="forest-button secondary" onClick={() => go('word')}>
                  <RotateCcw size={18} /> 다시 읽기
                </button>
                <button className="forest-button" onClick={() => go('character')}>
                  친구 꾸미기 <ArrowRight size={18} />
                </button>
              </div>
            </section>
          </>
        )}
        {view === 'character' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">나만의 숲속 단짝</span>
                <h1>친구 꾸미기</h1>
                <p>좋아하는 모습으로 함께 모험해요.</p>
              </div>
            </div>
            <div className="forest-customize">
              <section className="forest-character-preview">
                <span className="forest-pill">미리 보기</span>
                <Avatar profile={draft} large />
                <h2>{draft.name || '새싹'}</h2>
                <p>오늘도 너와 함께할게!</p>
              </section>
              <section className="forest-customize-options">
                <h2>어떤 친구가 좋을까?</h2>
                <div className="forest-option-row">
                  {(['rabbit', 'bear', 'cat'] as const).map((animal, i) => (
                    <button
                      key={animal}
                      className={draft.animal === animal ? 'selected' : ''}
                      aria-pressed={draft.animal === animal}
                      onClick={() => {
                        setDraft((d) => ({ ...d, animal }));
                        setSaved(false);
                      }}
                    >
                      {['🐰 토끼', '🐻 곰', '🐱 고양이'][i]}
                    </button>
                  ))}
                </div>
                <h3>포근한 색깔</h3>
                <div className="forest-option-row">
                  {['#b9dca8', '#f8d298', '#d6bce8'].map((color, i) => (
                    <button
                      key={color}
                      aria-label={['새싹색', '햇살색', '라일락색'][i]}
                      aria-pressed={draft.color === color}
                      className={`forest-swatch ${draft.color === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => {
                        setDraft((d) => ({ ...d, color }));
                        setSaved(false);
                      }}
                    >
                      {draft.color === color && <Check />}
                    </button>
                  ))}
                </div>
                <h3>오늘의 꾸미기</h3>
                <div className="forest-option-row">
                  {['없음', '꽃', '모자', '왕관'].map((hat, i) => {
                    const cost = i === 3 ? 20 : 0;
                    const locked = profile.leaves < cost;
                    return (
                      <button
                        key={hat}
                        className={draft.hat === hat ? 'selected' : ''}
                        disabled={locked}
                        aria-pressed={draft.hat === hat}
                        onClick={() => {
                          setDraft((d) => ({ ...d, hat }));
                          setSaved(false);
                        }}
                      >
                        {['🌱 기본', '🌼 꽃', '🧢 모자', '👑 왕관'][i]}
                        <small>{cost ? `나뭇잎 ${cost}개 모으면 열려요` : '처음부터 함께'}</small>
                      </button>
                    );
                  })}
                </div>
                <label className="forest-field">
                  친구 이름
                  <input
                    value={draft.name}
                    maxLength={8}
                    onChange={(e) => {
                      setDraft((d) => ({
                        ...d,
                        name: e.target.value.replace(/[<>\u0000-\u001f]/g, ''),
                      }));
                      setSaved(false);
                    }}
                    placeholder="새싹"
                  />
                </label>
                <div className="forest-actions">
                  <button className="forest-button" onClick={saveCharacter}>
                    이 모습으로 저장 <Check size={18} />
                  </button>
                  <button
                    className="forest-button secondary"
                    onClick={() => {
                      setDraft({
                        ...profile,
                        animal: initial.animal,
                        color: initial.color,
                        hat: initial.hat,
                      });
                      setSaved(false);
                    }}
                  >
                    기본 모습
                  </button>
                </div>
                {saved && (
                  <p className="forest-feedback success" role="status">
                    친구의 모습을 저장했어요!
                  </p>
                )}
              </section>
            </div>
          </>
        )}
        {view === 'parent' && (
          <>
            <div className="forest-heading">
              <div>
                <span className="forest-eyebrow">작은 성장을 함께 지켜봐 주세요</span>
                <h1>부모님 숲</h1>
              </div>
              <button className="forest-button secondary" onClick={() => go('home')}>
                아이 화면으로
              </button>
            </div>
            <p className="forest-tip">
              이 기기의 브라우저에만 기록을 저장합니다. 다른 기기와 동기화되지 않으며 브라우저
              데이터를 지우면 기록도 사라집니다. 부모 확인은 화면 진입을 위한 간단한 절차이며 보안
              잠금이 아닙니다.
            </p>
            <div className="forest-parent-stats">
              <section>
                <BookOpen />
                <strong>{profile.learned.length}</strong>
                <span>퀴즈를 마친 단어</span>
              </section>
              <section>
                <RotateCcw />
                <strong>{latestReview.length}</strong>
                <span>다시 연습할 단어</span>
              </section>
              <section>
                <Leaf />
                <strong>{profile.leaves}</strong>
                <span>모은 나뭇잎</span>
              </section>
            </div>
            <section className="forest-panel">
              <h2>우리 아이 학습 설정</h2>
              <div className="forest-settings-grid">
                <label className="forest-field">
                  아이 별명
                  <input
                    maxLength={8}
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        name: e.target.value.replace(/[<>\u0000-\u001f]/g, ''),
                      }))
                    }
                  />
                </label>
                <label className="forest-field">
                  문장 수준
                  <select
                    value={profile.level}
                    onChange={(e) => setProfile((p) => ({ ...p, level: Number(e.target.value) }))}
                  >
                    <option value={0}>탄탄 읽기</option>
                    <option value={1}>생각 읽기</option>
                    <option value={2}>도전 읽기</option>
                  </select>
                </label>
                <label className="forest-field">
                  읽기 속도
                  <select
                    value={profile.rate}
                    onChange={(e) => setProfile((p) => ({ ...p, rate: Number(e.target.value) }))}
                  >
                    <option value={0.65}>느리게</option>
                    <option value={0.85}>기본</option>
                    <option value={1}>조금 빠르게</option>
                  </select>
                </label>
                <label className="forest-field">
                  하루 학습 목표
                  <select
                    value={profile.goal}
                    onChange={(e) => setProfile((p) => ({ ...p, goal: Number(e.target.value) }))}
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option value={n} key={n}>
                        {n}분
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="forest-muted">
                시간 목표는 보호자가 참고하는 설정이며 사용 시간을 강제로 제한하지 않습니다. 설정은
                자동 저장됩니다.
              </p>
              <button
                className="forest-button secondary"
                onClick={() => speak('반가워요. 단어숲에서 함께 읽어요.')}
              >
                <Volume2 size={18} /> 한국어 음성 확인
              </button>
            </section>
            <section className="forest-panel">
              <h2>다시 만나면 좋은 단어</h2>
              {latestReview.length ? (
                <div className="forest-option-row">
                  {latestReview.map((r) => {
                    const w = words.find((w) => w.id === r.word)!;
                    return (
                      <button key={r.word} onClick={() => selectWord(w)}>
                        {w.emoji} {w.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="forest-muted">
                  아직 복습할 단어가 없어요. 퀴즈를 풀면 기록이 쌓여요.
                </p>
              )}
            </section>
            <section className="forest-panel">
              <h2>최근 학습 기록</h2>
              {profile.records.length ? (
                <ul className="forest-records">
                  {profile.records
                    .slice(-10)
                    .reverse()
                    .map((r, i) => (
                      <li key={r.date + i}>
                        <strong>{words.find((w) => w.id === r.word)?.name}</strong>
                        <span>
                          {r.firstTry}/{r.total ?? 3} · {r.review ? '복습 추천' : '잘 익혔어요'}
                        </span>
                        <time>
                          {new Date(r.date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                        </time>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="forest-muted">첫 번째 모험을 기다리고 있어요.</p>
              )}
            </section>
            <section className="forest-panel">
              <h2>기록 관리</h2>
              <p>기록과 캐릭터 설정을 이 브라우저에서 삭제합니다.</p>
              <button className="forest-button danger" onClick={() => setConfirm(true)}>
                프로필과 기록 삭제
              </button>
            </section>
          </>
        )}
        <footer className="forest-footer">
          작은 단어 하나, 커다란 세상 하나 🌱
          <br />
          <small>현재 단어 {words.length}개 · 기기에 학습 기록 저장</small>
        </footer>
      </main>
      <nav className="forest-nav" aria-label="학습 메뉴">
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-current={view === id ? 'page' : undefined}
            className={view === id ? 'active' : ''}
            onClick={() => go(id)}
          >
            <Icon size={23} />
            <span>{label}</span>
            {view === id && <i />}
          </button>
        ))}
      </nav>
      {gate && (
        <div className="forest-overlay">
          <section
            className="forest-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
          >
            <button
              className="forest-close"
              aria-label="부모 확인 닫기"
              onClick={() => setGate(false)}
            >
              <X />
            </button>
            <span className="forest-modal-emoji">🌳</span>
            <h2 id="gate-title">부모님과 함께 열어 주세요</h2>
            <p>보호자께서 아래 문제를 풀어 주세요.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (Number(gateAnswer) === gateNumbers[0] + gateNumbers[1] && gateAnswer.trim()) {
                  setGate(false);
                  go('parent');
                } else setGateError(true);
              }}
            >
              <label className="forest-field">
                {gateNumbers[0]} + {gateNumbers[1]} = ?
                <input
                  autoFocus
                  inputMode="numeric"
                  value={gateAnswer}
                  onChange={(e) => setGateAnswer(e.target.value)}
                  aria-label="부모 확인 답"
                />
              </label>
              {gateError && <p role="alert">답을 다시 확인해 주세요.</p>}
              <button className="forest-button" type="submit">
                부모님 숲 열기
              </button>
            </form>
          </section>
        </div>
      )}
      {confirm && (
        <div className="forest-overlay">
          <section
            className="forest-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">모든 기록을 삭제할까요?</h2>
            <p>학습 기록, 나뭇잎과 캐릭터 설정이 삭제되며 되돌릴 수 없습니다.</p>
            <div className="forest-actions">
              <button className="forest-button secondary" onClick={() => setConfirm(false)}>
                취소
              </button>
              <button
                className="forest-button danger"
                onClick={() => {
                  try {
                    localStorage.removeItem(key);
                  } catch {}
                  setProfile(initial);
                  setConfirm(false);
                  setView('home');
                  setNotice('이 기기의 프로필과 학습 기록을 삭제했어요.');
                }}
              >
                모두 삭제
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
