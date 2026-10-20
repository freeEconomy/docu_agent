'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, StepForward } from 'lucide-react';
import { storyVideos } from '@/lib/forest/media';
import { storyScenes, type SceneTheme } from '@/lib/forest/scenes';
function Explorer({
  x,
  y,
  color = '#247b7b',
  mood = 'calm',
  adult = false,
}: {
  x: number;
  y: number;
  color?: string;
  mood?: string;
  adult?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${adult ? 1.13 : 1})`} className="picture-person">
      <ellipse cx="0" cy="12" rx="25" ry="6" fill="#1b35282b" />
      <g className="picture-person-body">
        <path
          d="m-15-36-4 44m32-44 5 44"
          fill="none"
          stroke="#34465b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d="M-26 9h15m21 0h15" stroke="#c3aa78" strokeWidth="9" strokeLinecap="round" />
        <rect x="-24" y="-85" width="48" height="56" rx="15" fill={color} />
        <path
          className="picture-arm"
          d="M-22-71-39-45M22-71 40-55"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d="M-7-81v47m-14-4h42" stroke="#ffffff38" strokeWidth="2" />
        <rect x="18" y="-79" width="16" height="39" rx="5" fill="#d4a24e" />
        <circle cy="-107" r="24" fill="#dfad83" />
        <path d="M-24-107q-6-32 21-30 31-2 27 32l-12-20q-17 14-36 18" fill="#3e3934" />
        <path d="M-10-107h2m16 0h2" stroke="#40382c" strokeWidth="3" strokeLinecap="round" />
        {mood === 'wonder' ? (
          <ellipse cy="-95" rx="3" ry="4" fill="#7f4e3b" />
        ) : (
          <path
            d={mood === 'worry' ? 'M-6-92q6-6 12 0' : 'M-7-97q7 8 14 0'}
            stroke="#7f4e3b"
            strokeWidth="2"
            fill="none"
          />
        )}
        {adult && (
          <>
            <path d="M-31-129h62" stroke="#cbae71" strokeWidth="8" strokeLinecap="round" />
            <path d="M-19-133v-10h38v10" fill="#cbae71" />
          </>
        )}
      </g>
    </g>
  );
}
function Apple({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
      <path d="M0-11C-23-24-29 4-15 19Q0 27 15 19C30 3 22-24 0-11" fill="#bc5141" />
      <path d="m0-10 4-12" stroke="#705134" strokeWidth="3" />
      <path d="M4-20q14-10 17 0-10 6-17 0" fill="#6e9343" />
      <path d="M-12-8q-9 3-6 13" stroke="#f4b59a" strokeWidth="3" fill="none" />
    </g>
  );
}
function Objects({ theme, chapter }: { theme: SceneTheme; chapter: number }) {
  const orchard = theme === 'orchard';
  const interior = ['school', 'library', 'water', 'light', 'gallery'].includes(theme);
  return (
    <>
      {orchard && (
        <>
          <g className="picture-canopy">
            <path
              d="M590 280v-130m0 35-40-35m40 58 45-45"
              stroke="#795d3e"
              strokeWidth="17"
              fill="none"
            />
            <path
              d="M475 122q-4-60 62-63 50-43 95-3 70-1 73 62 25 64-58 74-68 25-121-8-77-3-51-62"
              fill="#77914d"
            />
            <Apple x={546} y={125} />
            <Apple x={621} y={94} />
            <Apple x={663} y={142} />
          </g>
          <g className={chapter === 3 ? 'picture-fall' : 'picture-crop'}>
            <Apple x={596} y={163} />
          </g>
          <path d="M473 275h84l-10 35h-64Z" fill="#bd9862" stroke="#8e7049" strokeWidth="3" />
          {chapter >= 2 && (
            <>
              <Apple x={498} y={277} small />
              <Apple x={531} y={277} small />
            </>
          )}
          {chapter === 2 && (
            <path
              className="picture-tool"
              d="m445 280 80-126m-9-2q12 15 22 3"
              fill="none"
              stroke="#baac83"
              strokeWidth="5"
            />
          )}
          {chapter >= 4 && (
            <g>
              <rect x="425" y="250" width="132" height="12" rx="3" fill="#987752" />
              <path d="M440 262v48m103-48v48" stroke="#785d45" strokeWidth="6" />
              <ellipse cx="490" cy="245" rx="32" ry="6" fill="#eee8d4" />
              <path d="M473 239q15-22 31 0" fill="#d6a14b" />
            </g>
          )}
        </>
      )}
      {theme === 'picnic' && (
        <>
          <path d="M385 263h245l38 55H347Z" fill="#c1a085" />
          <path d="m390 282 240 0m-188-18-15 51m100-51 15 51" stroke="#f4e8c9" strokeWidth="3" />
          <path d="M448 247h72v38h-72Z" fill="#b58d57" />
          <path d="M456 247q28-45 56 0" stroke="#8c714b" strokeWidth="5" fill="none" />
          <g className="picture-focus">
            <path d="M475 248q20 25 44 1-25 50-44-1" fill="#edc453" />
            <path d="M525 283q18 20 36 1-20 39-36-1" fill="#edc453" />
          </g>
          {chapter >= 2 && (
            <circle cx="494" cy="267" r="19" fill="none" stroke="#fff1bd" strokeDasharray="4 5" />
          )}
        </>
      )}
      {theme === 'bridge' && (
        <>
          <path d="M475 176q-30 50-10 89t-55 95h195q-55-60-35-95t-25-89Z" fill="#9dbdbb" />
          <g className="picture-water">
            <path
              d="M480 256h70m-83 34h86m-106 35h100"
              stroke="#d8e9dd"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          <path
            d={chapter < 2 ? 'M416 263h92' : 'M414 263h182'}
            stroke="#ae8b57"
            strokeWidth="12"
          />
          <path d="M440 270v36m130-36v36" stroke="#7a6a49" strokeWidth="7" />
          {chapter >= 3 && (
            <>
              <rect x="590" y="290" width="105" height="8" rx="3" fill="#c7ac78" />
              <path d="M607 298v20m66-20v20" stroke="#786c50" strokeWidth="5" />
              <ellipse className="picture-focus" cx="650" cy="283" rx="15" ry="9" fill="#83938b" />
            </>
          )}
        </>
      )}
      {interior && (
        <>
          <rect x="470" y="72" width="213" height="130" rx="4" fill="#d2c2a0" />
          <rect
            x="481"
            y="82"
            width="191"
            height="110"
            fill={theme === 'school' ? '#c3d7cd' : '#d4e5df'}
          />
          <path d="M577 82v110M481 135h191" stroke="#f2eee1" strokeWidth="6" />
          <rect x="416" y="250" width="285" height="14" rx="3" fill="#b79970" />
          <path d="M438 264v54m241-54v54" stroke="#897354" strokeWidth="8" />
        </>
      )}
      {theme === 'school' && (
        <>
          <path d="M495 226h55l-9 23h-37Z" fill="#b17b5b" />
          <path
            className="picture-canopy"
            d="M521 226v-33m0 15q-31-22-25 1 12 13 25 8m0-17q29-20 25 4-11 10-25 8"
            fill="#7b9a50"
            stroke="#638645"
            strokeWidth="3"
          />
          <g className="picture-focus">
            <ellipse cx="592" cy="242" rx="4" ry="3" fill="#907143" />
            <ellipse cx="614" cy="236" rx="4" ry="3" fill="#907143" />
            <path d="m625 220 24 19" stroke="#b18f57" strokeWidth="3" />
          </g>
          {chapter === 3 && (
            <path
              className="picture-wind"
              d="M525 119q50-10 105 0m-90 20q50-10 112 0"
              stroke="#f7fbef"
              strokeWidth="4"
              fill="none"
            />
          )}
        </>
      )}
      {theme === 'library' && (
        <>
          <rect x="76" y="77" width="165" height="147" rx="5" fill="#9c8966" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={86 + (i % 6) * 24}
              y={88 + Math.floor(i / 6) * 65}
              width="18"
              height="54"
              rx="2"
              fill={['#708c7d', '#bc8e64', '#dac797'][i % 3]}
            />
          ))}
          <g className="picture-box">
            <path d="M510 204h111v44H510Z" fill="#bc9663" />
            <path
              d={chapter < 3 ? 'M504 202h123v9H504Z' : 'M508 202l-15-23h110l20 23Z'}
              fill="#d4b17d"
            />
            <path d="m542 205 23 0" stroke="#f0dfb8" strokeWidth="5" />
            {chapter >= 3 && (
              <>
                <rect x="548" y="220" width="18" height="26" rx="5" fill="#dbe1c7" />
                <path d="m581 221 25 16-20 8" fill="#eee7cb" />
              </>
            )}
          </g>
        </>
      )}
      {theme === 'park' && (
        <>
          <g className="picture-canopy">
            <path
              d="M570 290V133m0 70-65-62m65 85 56-58"
              stroke="#806748"
              strokeWidth="17"
              fill="none"
            />
            <ellipse cx="570" cy="105" rx="105" ry="75" fill="#7e995e" />
            <ellipse cx="524" cy="129" rx="74" ry="56" fill="#75905a" />
            <path d="M614 130q27 22 42 0" stroke="#805d3e" strokeWidth="5" fill="none" />
          </g>
          <path
            d="M651 275v-78m0 0 57 80m-34-43-16 40"
            fill="none"
            stroke="#c2aa70"
            strokeWidth="8"
          />
          <rect
            className="picture-focus"
            x="409"
            y="239"
            width="84"
            height="47"
            rx="4"
            fill="#efe7cc"
          />
          <path d="m420 272 15-17 20 10 22-16" stroke="#85956a" strokeWidth="3" fill="none" />
        </>
      )}
      {theme === 'water' && (
        <>
          <g className="picture-lab-steam">
            <path
              d="M519 205q-10-15 0-27t0-20m27 47q-10-15 0-27t0-20"
              stroke="#eaf3ea"
              strokeWidth="4"
              fill="none"
            />
          </g>
          <ellipse cx="526" cy="244" rx="40" ry="8" fill="#efebd9" />
          <ellipse cx="526" cy="241" rx="31" ry={chapter >= 3 ? 3 : 5} fill="#91c3cd" />
          <ellipse cx="634" cy="244" rx="37" ry="8" fill="#efebd9" />
          <ellipse cx="634" cy="241" rx="29" ry="5" fill="#91c3cd" />
          <path d="M602 170h63l20 55h-63Z" fill="#819a854b" />
          <path d="M490 144 527 220m-17-76 37 76" stroke="#edcb71" strokeWidth="3" opacity=".6" />
        </>
      )}
      {theme === 'light' && (
        <>
          <path
            d="M538 177h80l-6 70h-68Z"
            fill="#d8e7e5"
            fillOpacity=".65"
            stroke="#f6f9ef"
            strokeWidth="3"
          />
          <path d="M543 213h70l-3 31h-63Z" fill="#87b9c4" fillOpacity=".65" />
          <path
            className="picture-straw"
            d={chapter === 1 ? 'm576 168 0 72' : 'm565 167 12 46-6 27'}
            stroke="#b88a66"
            strokeWidth="5"
            fill="none"
          />
          {chapter >= 3 && (
            <g opacity=".55">
              {['#b56653', '#d9ac5a', '#e0cf84', '#87a976', '#729b9c'].map((c, i) => (
                <path
                  key={c}
                  d={`M482 ${125 + i * 6}q83-${105 - i * 6} 167 0`}
                  stroke={c}
                  strokeWidth="5"
                  fill="none"
                />
              ))}
            </g>
          )}
        </>
      )}
      {theme === 'weather' && (
        <>
          <path
            d="M503 267v-98h151v98m-170-96 94-61 94 61Z"
            fill="none"
            stroke="#977958"
            strokeWidth="10"
          />
          <path d="m487 171 92-61 92 61Z" fill="#7e8c70" />
          {chapter >= 2 && (
            <g className="picture-cloud">
              <ellipse cx="551" cy="75" rx="72" ry="27" fill="#8da6a3" />
              <ellipse cx="522" cy="60" rx="29" ry="23" fill="#8da6a3" />
            </g>
          )}
          {chapter === 3 || chapter === 4 ? (
            <g className="picture-rain">
              {[465, 500, 535, 570, 605, 640, 675].map((x) => (
                <path key={x} d={`m${x} 112-12 32m7 34-12 32`} stroke="#a1c9d0" strokeWidth="3" />
              ))}
            </g>
          ) : null}
          <path className="picture-focus" d="M485 293q-8-19-21 0l-12 22h48Z" fill="#d4b85f" />
        </>
      )}
      {theme === 'gallery' && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${465 + i * 77} ${chapter >= 4 ? 146 : 201})`}>
              <rect width="62" height="45" fill="#f3eacf" stroke="#b59c73" strokeWidth="4" />
              <path
                d="m6 35 15-17 18 12 17-19"
                fill="none"
                stroke={['#6d9983', '#cfaa69', '#7f9cb6'][i]}
                strokeWidth="3"
              />
            </g>
          ))}
          <g className="picture-focus">
            <path d="M505 265q18-18 36 0v42h-36Z" fill="#be985a" />
            <path d="M515 258q8-18 16 0" fill="none" stroke="#6f7358" strokeWidth="4" />
          </g>
        </>
      )}
    </>
  );
}
export function StoryStage({
  lesson,
  chapter = 0,
  preview = false,
  onRead,
  onStop,
  narrating = false,
}: {
  lesson: string;
  chapter?: number;
  preview?: boolean;
  onRead?: () => void;
  onStop?: () => void;
  narrating?: boolean;
}) {
  const video = storyVideos[lesson]?.[chapter];
  const scene = storyScenes[lesson] || storyScenes.apple;
  const [failed, setFailed] = useState(false),
    [playing, setPlaying] = useState(false),
    [beat, setBeat] = useState(0),
    [reduced, setReduced] = useState(false),
    [visible, setVisible] = useState(true);
  const previousNarrating = useRef(false);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    const visibility = () => setVisible(!document.hidden);
    sync();
    visibility();
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    setFailed(false);
    setPlaying(false);
    setBeat(0);
    previousNarrating.current = false;
  }, [lesson, chapter]);
  useEffect(() => {
    if (narrating && !reduced && !preview) setPlaying(true);
    if (previousNarrating.current && !narrating) setPlaying(false);
    previousNarrating.current = narrating;
  }, [narrating, reduced, preview]);
  const active = playing && !reduced && visible && !preview;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setBeat((b) => (b + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, [active, lesson, chapter]);
  if (video && !failed && !preview)
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
      </div>
    );
  const inside = ['school', 'library', 'water', 'light', 'gallery'].includes(scene.theme);
  const mood = chapter === 1 || chapter === 3 ? 'worry' : chapter === 2 ? 'wonder' : 'calm';
  return (
    <div
      className={`picture-book ${preview ? 'picture-preview' : ''}`}
      data-lesson={lesson}
      data-chapter={chapter + 1}
      data-beat={beat}
      data-playing={active}
    >
      <div className="picture-canvas">
        <svg
          viewBox="0 0 800 360"
          role="img"
          aria-label={preview ? '숲속으로 이어지는 이야기 탐험' : scene.captions[chapter]}
        >
          <defs>
            <linearGradient id={`${id}-sky`} x2="0" y2="1">
              <stop stopColor={inside ? '#d7dfd5' : '#c9dfdc'} />
              <stop offset="1" stopColor="#f1e8ce" />
            </linearGradient>
            <linearGradient id={`${id}-ground`} x2="0" y2="1">
              <stop stopColor="#abbc8e" />
              <stop offset="1" stopColor="#6d8d6c" />
            </linearGradient>
            <radialGradient id={`${id}-sun`}>
              <stop stopColor="#fff7cf" />
              <stop offset="1" stopColor="#edd69b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#${id}-sky)`} />
          <circle cx="639" cy="62" r="100" fill={`url(#${id}-sun)`} />
          <circle cx="639" cy="62" r="23" fill="#eed38a" />
          {inside ? (
            <>
              <path d="M0 0h800v255H0Z" fill="#e8dfc9" fillOpacity=".6" />
              <path d="M0 263h800v97H0Z" fill="#b7ad8d" />
              <path
                d="m0 310 800 0m-620-47-90 97m300-97 20 97m220-97 160 97"
                stroke="#9f967c"
                strokeWidth="2"
                opacity=".3"
              />
            </>
          ) : (
            <>
              <path d="M0 205 132 104 322 229 509 107 800 217V360H0Z" fill="#9db3a1" />
              <path d="M0 264Q152 153 343 240T800 202V360H0Z" fill="#7d9f87" />
              <path d="M0 292Q202 235 416 287T800 265V360H0Z" fill={`url(#${id}-ground)`} />
              <path d="M207 252q-60 62-14 108h178q-128-81-104-108Z" fill="#d8c59d" />
              <g className="picture-canopy">
                <path
                  d="M92 290V122m0 57-34-30m34 61 40-45"
                  stroke="#5b7050"
                  strokeWidth="10"
                  fill="none"
                />
                <path d="M32 117q6-58 62-55 63 0 63 59 12 45-64 48-70-1-61-52" fill="#739463" />
              </g>
              <g className="picture-wind">
                <path
                  d="M139 110q52-15 96 0m-60 22q50-10 79 0"
                  stroke="#f3f5df"
                  strokeWidth="3"
                  fill="none"
                  opacity=".7"
                />
              </g>
            </>
          )}
          <Objects theme={scene.theme} chapter={chapter} />
          <g className="picture-explorer">
            <Explorer
              x={scene.theme === 'weather' && chapter >= 3 ? 543 : 308}
              y={302}
              mood={mood}
            />
          </g>
          <g className="picture-companion">
            <Explorer
              x={scene.theme === 'weather' && chapter >= 3 ? 611 : 391}
              y={309}
              color="#ae855f"
              mood={chapter === 5 ? 'calm' : mood}
            />
          </g>
          {scene.theme === 'orchard' && chapter >= 2 && (
            <Explorer x={444} y={301} adult color="#6e7956" />
          )}
          {!inside && (
            <g className="picture-leaf">
              <path d="m185 181q16-20 22 1-16 9-22-1" fill="#bfa354" />
              <path d="m745 198q16-20 22 1-16 9-22-1" fill="#e1c986" />
            </g>
          )}
        </svg>
        <span className="picture-label">
          {preview ? '이야기로 떠나는 탐험' : '움직이는 그림책'}
        </span>
      </div>
      {!preview && (
        <>
          <div className="picture-caption">
            <span>{['장면 살펴보기', '변화 발견하기', '인물의 마음 생각하기'][beat]}</span>
            <p>{scene.captions[chapter]}</p>
            <div className="picture-dots" aria-label={`움직임 ${beat + 1} / 3`}>
              {[0, 1, 2].map((n) => (
                <i key={n} className={n === beat ? 'active' : ''} />
              ))}
            </div>
          </div>
          <div className="picture-controls">
            <button
              disabled={reduced}
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                  onStop?.();
                } else setPlaying(true);
              }}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}{' '}
              {playing ? '장면 멈춤' : '장면 재생'}
            </button>
            <button
              onClick={() => {
                setBeat(0);
                setPlaying(false);
                onStop?.();
              }}
            >
              <RotateCcw size={17} /> 처음 장면
            </button>
            <button
              onClick={() => {
                setBeat((b) => (b + 1) % 3);
              }}
            >
              <StepForward size={17} /> 장면 넘기기
            </button>
            {onRead && (
              <button
                className="picture-read"
                onClick={() => {
                  if (!reduced) setPlaying(true);
                  onRead();
                }}
              >
                <Volume2 size={17} /> 함께 듣기
              </button>
            )}
          </div>
          {reduced && (
            <p className="picture-accessibility">
              동작 줄이기 설정에 따라 자동 움직임을 껐어요. ‘장면 넘기기’로 천천히 볼 수 있어요.
            </p>
          )}
          {failed && (
            <p role="status" className="picture-accessibility">
              영상을 불러오지 못했어요. 그림책과 글로 계속 읽을 수 있어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
