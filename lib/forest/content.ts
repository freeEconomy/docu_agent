export type Word = {
  id: string;
  name: string;
  emoji: string;
  category: '음식' | '동물' | '자연' | '생활';
  meaning: string;
  related: string[];
  sentences: [string, string, string];
  story: { title: string; pages: string[]; question: string; options: string[]; answer: string };
};
export const words: Word[] = [
  {
    id: 'apple',
    name: '사과',
    emoji: '🍎',
    category: '음식',
    meaning: '사과나무에서 열리는 둥근 과일이에요. 아삭아삭 씹어 먹어요.',
    related: ['과일', '씨앗', '사과나무'],
    sentences: [
      '사과가 빨개요.',
      '토끼가 사과를 씻어요.',
      '토끼가 나무 아래에서 빨간 사과를 찾았어요.',
    ],
    story: {
      title: '숲속의 빨간 사과',
      pages: [
        '맑은 가을날, {name} 친구가 숲길을 걸었어요. 나무 아래에 빨간 사과가 있었어요.',
        '“누가 떨어뜨린 사과일까?” {name} 친구는 주위를 살펴보았어요. 다람쥐가 나무에서 내려왔어요.',
        '“내가 딴 사과야. 같이 먹을래?” 다람쥐가 물었어요. 두 친구는 사과를 깨끗이 씻었어요.',
        '다람쥐의 엄마가 사과를 잘라 주었어요. 두 친구는 나누어 먹고 말했어요. “함께 먹으니 더 맛있다!”',
      ],
      question: '두 친구는 사과를 먹기 전에 무엇을 했나요?',
      options: ['깨끗이 씻었어요.', '땅에 묻었어요.', '그림을 그렸어요.'],
      answer: '깨끗이 씻었어요.',
    },
  },
  {
    id: 'banana',
    name: '바나나',
    emoji: '🍌',
    category: '음식',
    meaning: '길쭉하고 껍질을 벗겨 먹는 과일이에요.',
    related: ['과일', '껍질', '노랑'],
    sentences: [
      '바나나가 노래요.',
      '곰이 바나나 껍질을 벗겨요.',
      '곰이 바나나를 접시에 담아 친구에게 주어요.',
    ],
    story: {
      title: '나누어 먹는 바나나',
      pages: [
        '{name} 친구가 바구니를 들고 소풍을 갔어요. 바구니에는 바나나가 있었어요.',
        '토끼가 돗자리를 펴고 곰이 물을 꺼냈어요. 모두 손을 씻었어요.',
        '{name} 친구가 바나나 껍질을 벗겼어요. 친구들과 나누어 먹었어요.',
        '소풍이 끝나자 껍질을 쓰레기봉투에 담았어요. 풀밭이 다시 깨끗해졌어요.',
      ],
      question: '소풍이 끝나고 껍질은 어디에 담았나요?',
      options: ['쓰레기봉투', '연못', '책가방 속 책 사이'],
      answer: '쓰레기봉투',
    },
  },
  {
    id: 'rabbit',
    name: '토끼',
    emoji: '🐰',
    category: '동물',
    meaning: '긴 귀와 짧은 꼬리를 가진 동물이에요.',
    related: ['귀', '꼬리', '풀'],
    sentences: [
      '토끼의 귀가 길어요.',
      '토끼가 풀을 먹어요.',
      '토끼가 긴 귀를 세우고 주위의 소리를 들어요.',
    ],
    story: {
      title: '토끼의 긴 귀',
      pages: [
        '{name} 친구가 숲에서 토끼를 만났어요. 토끼는 긴 귀를 쫑긋 세웠어요.',
        '“무슨 소리가 나니?” {name} 친구가 물었어요. 토끼가 가만히 들어 보라고 했어요.',
        '졸졸졸, 가까운 곳에서 물소리가 났어요. 둘은 소리를 따라 작은 시냇가에 왔어요.',
        '두 친구는 시냇가에서 쉬었어요. 귀를 기울이니 새소리도 들렸어요.',
      ],
      question: '친구들이 처음 들은 소리는 무엇인가요?',
      options: ['물소리', '자동차 소리', '종소리'],
      answer: '물소리',
    },
  },
  {
    id: 'bear',
    name: '곰',
    emoji: '🐻',
    category: '동물',
    meaning: '몸이 크고 털이 덮여 있는 동물이에요.',
    related: ['발', '털', '숲'],
    sentences: ['곰의 발이 커요.', '곰이 숲길을 걸어요.', '커다란 곰이 나무 그늘에서 잠깐 쉬어요.'],
    story: {
      title: '곰의 작은 의자',
      pages: [
        '곰이 작은 의자를 만들었어요. {name} 친구에게 보여 주었어요.',
        '곰이 앉으려 하니 의자가 너무 작았어요. 곰은 다른 방법을 생각했어요.',
        '작은 다람쥐가 찾아왔어요. 다람쥐가 앉으니 의자가 꼭 맞았어요.',
        '곰은 의자를 다람쥐에게 선물했어요. {name} 친구가 웃으며 손뼉을 쳤어요.',
      ],
      question: '작은 의자에 꼭 맞았던 친구는 누구인가요?',
      options: ['다람쥐', '코끼리', '고래'],
      answer: '다람쥐',
    },
  },
  {
    id: 'cat',
    name: '고양이',
    emoji: '🐱',
    category: '동물',
    meaning: '수염과 부드러운 털이 있고 야옹 하고 우는 동물이에요.',
    related: ['수염', '발', '꼬리'],
    sentences: [
      '고양이가 야옹 해요.',
      '고양이가 몸을 쭉 펴요.',
      '햇볕이 드는 창가에서 고양이가 쉬어요.',
    ],
    story: {
      title: '고양이의 낮잠',
      pages: [
        '{name} 친구가 책을 읽고 있었어요. 고양이가 창가로 걸어왔어요.',
        '고양이는 앞발을 쭉 뻗고 몸을 폈어요. 그러고는 둥글게 몸을 말았어요.',
        '{name} 친구는 목소리를 낮추었어요. 고양이가 낮잠을 자고 있었기 때문이에요.',
        '잠에서 깬 고양이가 야옹 했어요. {name} 친구가 조용히 인사했어요.',
      ],
      question: '친구가 목소리를 낮춘 까닭은 무엇인가요?',
      options: ['고양이가 자고 있어서', '비가 와서', '불이 꺼져서'],
      answer: '고양이가 자고 있어서',
    },
  },
  {
    id: 'tree',
    name: '나무',
    emoji: '🌳',
    category: '자연',
    meaning: '뿌리와 줄기, 가지가 있고 오랫동안 자라는 식물이에요.',
    related: ['잎', '가지', '뿌리'],
    sentences: [
      '나무가 자라요.',
      '나무에 잎이 달렸어요.',
      '커다란 나무 아래에 시원한 그늘이 생겼어요.',
    ],
    story: {
      title: '나무 아래 쉼터',
      pages: [
        '더운 날, {name} 친구가 산책을 했어요. 햇볕이 따뜻했어요.',
        '길가에 잎이 무성한 나무가 있었어요. 나무 아래에는 그늘이 생겼어요.',
        '{name} 친구가 그늘에서 물을 마셨어요. 새 한 마리가 가지에 앉았어요.',
        '잠깐 쉬고 나니 기운이 났어요. {name} 친구는 나무를 바라보며 인사했어요.',
      ],
      question: '친구는 어디에서 쉬었나요?',
      options: ['나무 그늘', '지붕 위', '물속'],
      answer: '나무 그늘',
    },
  },
  {
    id: 'sun',
    name: '해',
    emoji: '☀️',
    category: '자연',
    meaning: '낮에 하늘에서 빛과 열을 보내 주는 별이에요.',
    related: ['하늘', '낮', '햇빛'],
    sentences: ['해가 떠요.', '햇빛이 방 안에 들어와요.', '아침 해가 뜨자 창가가 환해졌어요.'],
    story: {
      title: '햇빛과 작은 화분',
      pages: [
        '아침이 되자 해가 떴어요. {name} 친구가 커튼을 열었어요.',
        '창가의 작은 화분에 햇빛이 닿았어요. 흙을 만져 보니 말라 있었어요.',
        '{name} 친구는 화분에 알맞게 물을 주었어요. 잎에 물방울이 반짝였어요.',
        '다음 날에도 화분을 살폈어요. 작은 새잎이 돋아나고 있었어요.',
      ],
      question: '마른 흙을 확인한 뒤 무엇을 했나요?',
      options: ['물을 주었어요.', '화분을 던졌어요.', '커튼을 닫았어요.'],
      answer: '물을 주었어요.',
    },
  },
  {
    id: 'rainbow',
    name: '무지개',
    emoji: '🌈',
    category: '자연',
    meaning: '햇빛이 물방울을 지나며 여러 색으로 보이는 둥근 띠예요.',
    related: ['비', '햇빛', '하늘'],
    sentences: [
      '무지개가 보여요.',
      '하늘에 무지개가 떴어요.',
      '비가 그친 뒤 하늘에 여러 빛깔 무지개가 보였어요.',
    ],
    story: {
      title: '비가 그친 하늘',
      pages: [
        '비가 내려 {name} 친구는 창밖을 보았어요. 우산 쓴 사람들이 지나갔어요.',
        '잠시 뒤 비가 그쳤어요. 구름 사이로 햇빛이 비쳤어요.',
        '하늘에 무지개가 보였어요. {name} 친구가 여러 색을 천천히 살펴보았어요.',
        '{name} 친구는 종이에 무지개를 그렸어요. 오늘 본 하늘을 오래 기억하고 싶었어요.',
      ],
      question: '친구는 무지개를 보고 무엇을 했나요?',
      options: ['그림을 그렸어요.', '눈사람을 만들었어요.', '잠을 잤어요.'],
      answer: '그림을 그렸어요.',
    },
  },
  {
    id: 'hat',
    name: '모자',
    emoji: '🧢',
    category: '생활',
    meaning: '머리에 쓰는 물건이에요. 햇빛이나 추위를 막는 데 쓰기도 해요.',
    related: ['머리', '챙', '옷'],
    sentences: [
      '모자를 써요.',
      '친구가 파란 모자를 써요.',
      '햇빛이 강해서 챙이 있는 모자를 썼어요.',
    ],
    story: {
      title: '바람과 파란 모자',
      pages: [
        '{name} 친구가 파란 모자를 쓰고 나갔어요. 바람이 살랑 불었어요.',
        '갑자기 센 바람이 불었어요. 모자가 벗겨져 잔디 위에 떨어졌어요.',
        '{name} 친구는 주위를 살피고 잔디로 걸어갔어요. 모자를 주워 흙을 털었어요.',
        '모자를 다시 쓰고 끈을 조절했어요. 이제 바람이 불어도 잘 벗겨지지 않았어요.',
      ],
      question: '바람에 날린 모자는 어디에 떨어졌나요?',
      options: ['잔디 위', '바다 한가운데', '나무 꼭대기'],
      answer: '잔디 위',
    },
  },
  {
    id: 'bag',
    name: '가방',
    emoji: '🎒',
    category: '생활',
    meaning: '물건을 넣어 들거나 메고 다니는 물건이에요.',
    related: ['책', '주머니', '어깨'],
    sentences: ['가방을 메요.', '가방에 책을 넣어요.', '소풍 가방에 물과 손수건을 챙겼어요.'],
    story: {
      title: '스스로 챙긴 가방',
      pages: [
        '내일은 소풍날이에요. {name} 친구가 가방을 열었어요.',
        '준비물 목록을 보며 물과 손수건을 넣었어요. 모자도 챙겼어요.',
        '가방이 너무 무겁지 않은지 메어 보았어요. 필요 없는 장난감은 꺼냈어요.',
        '다음 날 {name} 친구는 가방을 메고 출발했어요. 스스로 준비해서 뿌듯했어요.',
      ],
      question: '무거운 가방에서 무엇을 꺼냈나요?',
      options: ['필요 없는 장난감', '손수건', '물'],
      answer: '필요 없는 장난감',
    },
  },
];
export const categories = ['전체', '동물', '음식', '자연', '생활'] as const;
export function findWord(input: string) {
  const name = input.normalize('NFKC').trim().replace(/\s/g, '');
  return words.find((w) => w.name === name || (w.id === 'sun' && ['햇님', '태양'].includes(name)));
}
export function makeQuiz(word: Word) {
  const other = words.filter((w) => w.id !== word.id);
  const distractors = other
    .filter((w) => w.category === word.category)
    .concat(other.filter((w) => w.category !== word.category))
    .slice(0, 2);
  const choices = [word, ...distractors]
    .map((w) => w.name)
    .sort((a, b) => a.localeCompare(b, 'ko'));
  return [
    {
      question: `이 그림에 맞는 단어는 무엇일까요?`,
      visual: word.emoji,
      options: choices,
      answer: word.name,
      hint: word.meaning,
    },
    {
      question: `빈칸에 들어갈 단어를 골라요.`,
      visual: '✏️',
      sentence: word.sentences[0].replace(word.name, '____'),
      options: [...choices].reverse(),
      answer: word.name,
      hint: `${word.name[0]}${'○'.repeat(word.name.length - 1)}로 시작해요.`,
    },
    {
      question: word.story.question,
      visual: '📖',
      options: word.story.options,
      answer: word.story.answer,
      hint: word.story.pages.join(' ').replaceAll('{name}', '우리'),
    },
  ];
}
