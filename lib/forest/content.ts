export type Question = {
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
  sentence?: string;
  photo?: boolean;
};
export type Word = {
  id: string;
  name: string;
  korean: string;
  category: '집에서' | '학교에서' | '밖에서';
  meaning: string;
  photo: string;
  photoId: string;
  sentences: [string, string, string];
  translations: [string, string, string];
  alternate: [string, string, string];
  alternateTranslations: [string, string, string];
  glossary: { term: string; meaning: string }[];
  story: { title: string; pages: string[]; translations: string[]; questions: Question[] };
};
const data = [
  {
    id: 'bus',
    name: 'bus',
    korean: '버스',
    category: '밖에서',
    photoId: 'bus',
    meaning: '여러 사람이 함께 타는 버스예요. 기다릴 때, 목적지를 물을 때 쓸 수 있는 말을 배워요.',
    sentences: [
      'I can see a bus.',
      'We are waiting for the bus at the bus stop.',
      'Excuse me. Does this bus go to the park?',
    ],
    translations: [
      '버스가 보여요.',
      '우리는 정류장에서 버스를 기다리고 있어요.',
      '실례합니다. 이 버스는 공원에 가나요?',
    ],
    alternate: [
      'The bus has big windows.',
      'Please wait until the bus stops.',
      'May I sit here, or is this seat taken?',
    ],
    alternateTranslations: [
      '버스에는 큰 창문이 있어요.',
      '버스가 멈출 때까지 기다려 주세요.',
      '여기 앉아도 되나요, 아니면 누가 앉는 자리인가요?',
    ],
    glossary: [
      { term: 'bus stop', meaning: '버스 정류장' },
      { term: 'seat', meaning: '앉는 자리, 좌석' },
      { term: 'wait', meaning: '기다리다' },
    ],
    story: {
      title: '버스를 타고 공원에 가요',
      pages: [
        'We are going to the park. We walk to the bus stop.',
        'A bus is coming. We wait until it stops.',
        'Excuse me. Does this bus go to the park? Yes, it does.',
        'We get on the bus with an adult. We find two empty seats.',
        'May I sit here? Yes, you may. Thank you.',
        'This is our stop. We get off with an adult. The park is across the street.',
      ],
      translations: [
        '우리는 공원에 가요. 버스 정류장으로 걸어가요.',
        '버스가 오고 있어요. 버스가 멈출 때까지 기다려요.',
        '실례합니다. 이 버스는 공원에 가나요? 네, 가요.',
        '어른과 함께 버스에 타요. 빈자리 두 개를 찾아요.',
        '여기 앉아도 되나요? 네, 앉아도 돼요. 고마워요.',
        '우리가 내릴 정류장이에요. 어른과 함께 내려요. 공원은 길 건너편에 있어요.',
      ],
    },
  },
  {
    id: 'train',
    name: 'train',
    korean: '기차',
    category: '밖에서',
    photoId: 'train',
    meaning: '철길을 따라 달리는 기차예요. 역에서 표와 출발 시간을 확인하는 말을 배워요.',
    sentences: [
      'This is a train.',
      'The train is waiting at the station.',
      'Could you help me find the right platform, please?',
    ],
    translations: [
      '이것은 기차예요.',
      '기차가 역에서 기다리고 있어요.',
      '맞는 승강장을 찾도록 도와주시겠어요?',
    ],
    alternate: [
      'The train has many doors.',
      'Please keep your ticket in your bag.',
      'We should check the time before we get on the train.',
    ],
    alternateTranslations: [
      '기차에는 문이 많이 있어요.',
      '표를 가방에 넣어 두세요.',
      '기차에 타기 전에 시간을 확인해야 해요.',
    ],
    glossary: [
      { term: 'station', meaning: '기차역' },
      { term: 'ticket', meaning: '표, 승차권' },
      { term: 'platform', meaning: '기차를 타고 내리는 승강장' },
    ],
    story: {
      title: '기차역에서 길을 물어요',
      pages: [
        'We are at the station. We are going to visit Grandma.',
        'Here are our tickets. We check the time with an adult.',
        'Where is platform two? Let us ask a station worker.',
        'Excuse me. Where is platform two? It is on your left.',
        'We wait behind the safety line. We get on when the train stops.',
        'We find our seats and put away our bags. Thank you for your help!',
      ],
      translations: [
        '우리는 역에 있어요. 할머니를 만나러 가요.',
        '여기 우리 표가 있어요. 어른과 시간을 확인해요.',
        '2번 승강장은 어디일까요? 역 직원에게 물어봐요.',
        '실례합니다. 2번 승강장은 어디인가요? 왼쪽에 있어요.',
        '안전선 뒤에서 기다려요. 기차가 멈추면 타요.',
        '자리를 찾고 가방을 정리해요. 도와주셔서 고마워요!',
      ],
    },
  },
  {
    id: 'car',
    name: 'car',
    korean: '자동차',
    category: '밖에서',
    photoId: 'car',
    meaning: '가족이나 친구와 이동할 때 타는 자동차예요. 안전벨트와 준비 상태를 말해 봐요.',
    sentences: [
      'The car is white.',
      'Please put on your seat belt.',
      'Are you ready to go, or do you need more time?',
    ],
    translations: [
      '자동차가 하얀색이에요.',
      '안전벨트를 매 주세요.',
      '출발할 준비가 됐나요, 아니면 시간이 더 필요한가요?',
    ],
    alternate: [
      'Our car has four wheels.',
      'My bag is in the back of the car.',
      'We wait for an adult before we open the car door.',
    ],
    alternateTranslations: [
      '우리 자동차에는 바퀴가 네 개 있어요.',
      '내 가방은 자동차 뒤쪽에 있어요.',
      '자동차 문을 열기 전에 어른을 기다려요.',
    ],
    glossary: [
      { term: 'seat belt', meaning: '안전벨트' },
      { term: 'wheel', meaning: '바퀴' },
      { term: 'ready', meaning: '준비가 된' },
    ],
    story: {
      title: '자동차로 출발하기 전에',
      pages: [
        'We are going to the library by car. I bring my book.',
        'Is your bag ready? Yes. My book is in my bag.',
        'An adult helps me get into my car seat. I put on my seat belt.',
        'Are you ready? Not yet. Let me check my seat belt.',
        'Now we are ready. We keep our seat belts on during the ride.',
        'We arrive at the library. We wait for an adult before getting out.',
      ],
      translations: [
        '자동차로 도서관에 가요. 책을 챙겨요.',
        '가방은 준비됐나요? 네. 책은 가방 안에 있어요.',
        '어른이 어린이용 좌석에 앉도록 도와줘요. 안전벨트를 매요.',
        '준비됐나요? 아직이요. 안전벨트를 확인할게요.',
        '이제 준비됐어요. 이동하는 동안 안전벨트를 매고 있어요.',
        '도서관에 도착해요. 내리기 전에 어른을 기다려요.',
      ],
    },
  },
  {
    id: 'airplane',
    name: 'airplane',
    korean: '비행기',
    category: '밖에서',
    photoId: 'airplane',
    meaning: '하늘을 날아 먼 곳으로 이동하는 비행기예요. 공항과 기내에서 필요한 말을 배워요.',
    sentences: [
      'I see an airplane.',
      'The airplane is waiting at the airport.',
      'Could I have some water, please?',
    ],
    translations: ['비행기가 보여요.', '비행기가 공항에서 기다리고 있어요.', '물 좀 주시겠어요?'],
    alternate: [
      'The airplane has two wings.',
      'We put our small bags under the seats.',
      'Please keep your seat belt on while you are sitting.',
    ],
    alternateTranslations: [
      '비행기에는 날개가 두 개 있어요.',
      '작은 가방을 좌석 아래에 넣어요.',
      '앉아 있는 동안 안전벨트를 매 주세요.',
    ],
    glossary: [
      { term: 'airport', meaning: '공항' },
      { term: 'wing', meaning: '비행기의 날개' },
      { term: 'water', meaning: '물' },
    ],
    story: {
      title: '비행기에서 정중하게 부탁해요',
      pages: [
        'We are at the airport with our family. We can see an airplane.',
        'We check our gate with an adult. We wait for our turn.',
        'On the airplane, we find our seats. We put our bags away.',
        'I am thirsty. Could I have some water, please?',
        'Here you are. Thank you very much. You are welcome.',
        'We keep our seat belts on. We look out of the window together.',
      ],
      translations: [
        '가족과 공항에 있어요. 비행기가 보여요.',
        '어른과 탑승구를 확인해요. 차례를 기다려요.',
        '비행기에서 자리를 찾아요. 가방을 정리해요.',
        '목이 말라요. 물 좀 주시겠어요?',
        '여기 있어요. 정말 고마워요. 천만에요.',
        '안전벨트를 매고 있어요. 함께 창밖을 봐요.',
      ],
    },
  },
  {
    id: 'laptop',
    name: 'laptop',
    korean: '노트북',
    category: '학교에서',
    photoId: 'laptop',
    meaning:
      '화면과 키보드를 함께 접어 가지고 다니는 컴퓨터예요. 사진은 예전 노트북의 실제 모습이에요.',
    sentences: [
      'This is a laptop.',
      'I use the keyboard to type my name.',
      'May I use the laptop after you finish?',
    ],
    translations: [
      '이것은 노트북이에요.',
      '키보드로 내 이름을 입력해요.',
      '다 쓰고 나면 제가 노트북을 사용해도 될까요?',
    ],
    alternate: [
      'The screen is open.',
      'Please keep your drink away from the laptop.',
      'I will save my work before I close the laptop.',
    ],
    alternateTranslations: [
      '화면이 열려 있어요.',
      '노트북 가까이에 음료를 두지 마세요.',
      '노트북을 닫기 전에 작업을 저장할게요.',
    ],
    glossary: [
      { term: 'keyboard', meaning: '글자를 입력하는 키보드' },
      { term: 'screen', meaning: '화면' },
      { term: 'save', meaning: '저장하다' },
    ],
    story: {
      title: '함께 쓰는 노트북',
      pages: [
        'We are making a class picture book. We share a laptop.',
        'My friend is typing a title. I wait for my turn.',
        'May I use the laptop after you finish? Yes. Give me one minute.',
        'It is my turn now. I type my name with the keyboard.',
        'Please save your work before you close the laptop. All right.',
        'We save the file and close the laptop. Thank you for sharing.',
      ],
      translations: [
        '학급 그림책을 만들고 있어요. 노트북을 함께 써요.',
        '친구가 제목을 입력하고 있어요. 차례를 기다려요.',
        '다 쓰고 나면 제가 써도 될까요? 네. 1분만 기다려 주세요.',
        '이제 내 차례예요. 키보드로 내 이름을 입력해요.',
        '노트북을 닫기 전에 작업을 저장해 주세요. 알겠어요.',
        '파일을 저장하고 노트북을 닫아요. 함께 써 줘서 고마워요.',
      ],
    },
  },
  {
    id: 'chair',
    name: 'chair',
    korean: '의자',
    category: '집에서',
    photoId: 'chair',
    meaning:
      '앉을 때 쓰는 의자예요. 사진은 오래된 장식 의자지만, 집과 학교의 의자에도 chair라는 말을 써요.',
    sentences: [
      'This is a chair.',
      'Please put the chair next to the table.',
      'Excuse me. May I sit in this chair?',
    ],
    translations: [
      '이것은 의자예요.',
      '의자를 탁자 옆에 놓아 주세요.',
      '실례합니다. 이 의자에 앉아도 될까요?',
    ],
    alternate: [
      'The chair has four legs.',
      'There is an empty chair by the window.',
      'Please ask before you move someone else’s chair.',
    ],
    alternateTranslations: [
      '의자에는 다리가 네 개 있어요.',
      '창문 옆에 빈 의자가 있어요.',
      '다른 사람의 의자를 옮기기 전에 물어보세요.',
    ],
    glossary: [
      { term: 'sit', meaning: '앉다' },
      { term: 'empty', meaning: '비어 있는' },
      { term: 'next to', meaning: '바로 옆에' },
    ],
    story: {
      title: '빈자리가 있는지 물어요',
      pages: [
        'We are in the reading room. I would like to read a book.',
        'There is a chair by the window. A bag is on the chair.',
        'Excuse me. Is someone sitting here? Yes. My friend is coming.',
        'All right. Is that chair free? Yes, it is.',
        'May I sit here? Of course. Please take a seat.',
        'Thank you. I put my bag under my chair and open my book.',
      ],
      translations: [
        '독서실에 있어요. 책을 읽고 싶어요.',
        '창문 옆에 의자가 있어요. 가방이 의자 위에 있어요.',
        '실례합니다. 누가 여기 앉나요? 네. 친구가 올 거예요.',
        '알겠어요. 저 의자는 비어 있나요? 네, 비어 있어요.',
        '여기 앉아도 될까요? 물론이죠. 앉으세요.',
        '고마워요. 가방을 내 의자 아래에 놓고 책을 펼쳐요.',
      ],
    },
  },
  {
    id: 'bowl',
    name: 'bowl',
    korean: '그릇',
    category: '집에서',
    photoId: 'bowl',
    meaning:
      '음식을 담는 오목한 그릇이에요. 그릇과 식기를 준비하거나 건네 달라고 부탁하는 말을 배워요.',
    sentences: [
      'This is a bowl.',
      'Please put the bowl on the table.',
      'Could you pass me the empty bowl, please?',
    ],
    translations: [
      '이것은 그릇이에요.',
      '그릇을 탁자 위에 놓아 주세요.',
      '빈 그릇을 저에게 건네주시겠어요?',
    ],
    alternate: [
      'The bowl is white.',
      'I need a bowl and a spoon.',
      'Let us wash our hands before we set the table.',
    ],
    alternateTranslations: [
      '그릇이 하얀색이에요.',
      '그릇과 숟가락이 필요해요.',
      '식탁을 차리기 전에 손을 씻어요.',
    ],
    glossary: [
      { term: 'spoon', meaning: '숟가락' },
      { term: 'pass', meaning: '건네주다' },
      { term: 'table', meaning: '탁자, 식탁' },
    ],
    story: {
      title: '함께 식탁을 준비해요',
      pages: [
        'It is time to set the table. Let us wash our hands first.',
        'What do we need? We need bowls and spoons.',
        'Could you pass me a bowl, please? Here you are.',
        'Thank you. I put the bowl on the table carefully.',
        'An adult brings the hot soup. I keep my hands away from the pot.',
        'The table is ready. After we eat, we help clean up.',
      ],
      translations: [
        '식탁을 차릴 시간이에요. 먼저 손을 씻어요.',
        '무엇이 필요하죠? 그릇과 숟가락이 필요해요.',
        '그릇 하나 건네주시겠어요? 여기 있어요.',
        '고마워요. 조심스럽게 그릇을 식탁 위에 놓아요.',
        '어른이 뜨거운 수프를 가져와요. 냄비에 손을 대지 않아요.',
        '식탁이 준비됐어요. 식사 뒤에는 정리도 도와요.',
      ],
    },
  },
  {
    id: 'sign',
    name: 'sign',
    korean: '표지판',
    category: '밖에서',
    photoId: 'sign',
    meaning:
      '글자나 그림으로 정보를 알려 주는 표지판이에요. 사진은 제한 속도를 알려 주는 표지판이며 정지 표지판은 아니에요.',
    sentences: [
      'Look at the sign.',
      'The sign tells us the speed limit.',
      'Let us look for a crossing before we cross the street.',
    ],
    translations: [
      '표지판을 보세요.',
      '표지판이 제한 속도를 알려 줘요.',
      '길을 건너기 전에 횡단보도를 찾아봐요.',
    ],
    alternate: [
      'There is a number on the sign.',
      'We read the signs with an adult.',
      'If you do not understand a sign, ask an adult for help.',
    ],
    alternateTranslations: [
      '표지판에 숫자가 있어요.',
      '어른과 함께 표지판을 읽어요.',
      '표지판을 이해하지 못하면 어른에게 도움을 요청하세요.',
    ],
    glossary: [
      { term: 'street', meaning: '거리, 길' },
      { term: 'crossing', meaning: '횡단보도, 길을 건너는 곳' },
      { term: 'help', meaning: '도움, 돕다' },
    ],
    story: {
      title: '길에서 정보를 찾아요',
      pages: [
        'We are walking with an adult. We see a sign beside the road.',
        'Look at the sign. What does the number mean?',
        'It tells drivers the speed limit. It is not a stop sign.',
        'We want to cross the street. Let us find a crossing.',
        'We stop and look carefully with an adult. We cross when it is safe.',
        'Signs give us information. If we are not sure, we ask for help.',
      ],
      translations: [
        '어른과 함께 걸어요. 도로 옆에 표지판이 보여요.',
        '표지판을 보세요. 숫자는 무슨 뜻일까요?',
        '운전자에게 제한 속도를 알려 줘요. 정지 표지판은 아니에요.',
        '길을 건너고 싶어요. 횡단보도를 찾아봐요.',
        '어른과 함께 멈춰서 주의 깊게 살펴요. 안전할 때 건너요.',
        '표지판은 정보를 알려 줘요. 잘 모르겠으면 도움을 구해요.',
      ],
    },
  },
  {
    id: 'building',
    name: 'building',
    korean: '건물',
    category: '학교에서',
    photoId: 'building',
    meaning:
      '사람들이 살거나 공부하거나 일하는 건물이에요. 건물에서 입구를 찾고 길을 묻는 표현을 배워요.',
    sentences: [
      'That is a tall building.',
      'The entrance is next to the big window.',
      'Excuse me. Could you show me the way to the entrance?',
    ],
    translations: [
      '저것은 높은 건물이에요.',
      '입구는 큰 창문 옆에 있어요.',
      '실례합니다. 입구로 가는 길을 알려 주시겠어요?',
    ],
    alternate: [
      'The building has many windows.',
      'We meet our teacher at the entrance.',
      'We stay together when we visit a new building.',
    ],
    alternateTranslations: [
      '건물에는 창문이 많이 있어요.',
      '입구에서 선생님을 만나요.',
      '새로운 건물에 갈 때는 함께 다녀요.',
    ],
    glossary: [
      { term: 'entrance', meaning: '입구' },
      { term: 'floor', meaning: '건물의 층, 바닥' },
      { term: 'together', meaning: '함께' },
    ],
    story: {
      title: '처음 가는 건물에서',
      pages: [
        'We visit a new building with our teacher. We stay together.',
        'The building has many windows. Where is the entrance?',
        'Excuse me. Where is the entrance? It is around the corner.',
        'Thank you. We walk around the corner with our teacher.',
        'Here is the entrance. Please wait here while I check in.',
        'We wait together. Then we follow our teacher inside.',
      ],
      translations: [
        '선생님과 새로운 건물에 가요. 함께 다녀요.',
        '건물에 창문이 많이 있어요. 입구는 어디일까요?',
        '실례합니다. 입구는 어디인가요? 모퉁이를 돌면 있어요.',
        '고마워요. 선생님과 모퉁이를 돌아가요.',
        '여기가 입구예요. 제가 접수하는 동안 여기서 기다리세요.',
        '함께 기다려요. 그런 다음 선생님을 따라 안으로 들어가요.',
      ],
    },
  },
  {
    id: 'window',
    name: 'window',
    korean: '창문',
    category: '집에서',
    photoId: 'building',
    meaning: '빛이 들어오고 밖을 볼 수 있는 창문이에요. 사진 속 건물의 유리창을 찾아보세요.',
    sentences: [
      'I can see a window.',
      'The room is bright because the window is big.',
      'Could you open the window a little, please?',
    ],
    translations: ['창문이 보여요.', '창문이 커서 방이 밝아요.', '창문을 조금 열어 주시겠어요?'],
    alternate: [
      'There are many windows.',
      'Please ask an adult to help with the window.',
      'I would like to sit by the window so I can see outside.',
    ],
    alternateTranslations: [
      '창문이 많이 있어요.',
      '어른에게 창문 여는 것을 도와 달라고 하세요.',
      '밖을 볼 수 있도록 창문 옆에 앉고 싶어요.',
    ],
    glossary: [
      { term: 'open', meaning: '열다' },
      { term: 'close', meaning: '닫다' },
      { term: 'outside', meaning: '바깥, 바깥에' },
    ],
    story: {
      title: '창문을 열어 달라고 부탁해요',
      pages: [
        'We are reading in a room. The room feels warm.',
        'I would like some fresh air. I ask an adult for help.',
        'Could you open the window a little, please? Yes, I can.',
        'The adult checks the window and opens it safely. We stay away from the edge.',
        'Fresh air comes in. Thank you. That feels better.',
        'It starts to rain. Could you close the window, please?',
      ],
      translations: [
        '방에서 책을 읽고 있어요. 방이 따뜻해요.',
        '신선한 공기가 있으면 좋겠어요. 어른에게 도움을 구해요.',
        '창문을 조금 열어 주시겠어요? 네, 그럴게요.',
        '어른이 창문을 확인하고 안전하게 열어요. 우리는 창가 끝에 가까이 가지 않아요.',
        '신선한 공기가 들어와요. 고마워요. 한결 좋아졌어요.',
        '비가 오기 시작해요. 창문을 닫아 주시겠어요?',
      ],
    },
  },
] as const;
const details: Record<
  string,
  {
    question: string;
    options: string[];
    answer: number;
    hint: string;
    explanation: string;
    order: [string, string, string];
  }
> = {
  bus: {
    question: '대화 속 버스는 어디로 가나요?',
    options: ['To the park.', 'To the airport.', 'To the library.'],
    answer: 0,
    hint: 'Does this bus go to the park? Yes, it does.',
    explanation: '공원으로 가는 버스인지 묻자 그렇다고 대답했어요.',
    order: ['버스가 멈추기를 기다리기', '어른과 함께 타기', '자리 찾아 앉기'],
  },
  train: {
    question: '2번 승강장은 어느 쪽에 있나요?',
    options: ['On your right.', 'On your left.', 'Behind the train.'],
    answer: 1,
    hint: 'Where is platform two? It is on your left.',
    explanation: 'on your left는 왼쪽에 있다는 뜻이에요.',
    order: ['어른과 표·시간 확인하기', '역 직원에게 승강장 묻기', '안전선 뒤에서 기다리기'],
  },
  car: {
    question: '이동하는 동안 계속 해야 하는 것은?',
    options: ['Open the door.', 'Take off the seat belt.', 'Keep the seat belt on.'],
    answer: 2,
    hint: 'We keep our seat belts on during the ride.',
    explanation: 'keep ... on은 계속 착용하고 있다는 뜻이에요.',
    order: ['가방에 책 챙기기', '어린이용 좌석과 안전벨트 확인하기', '어른과 출발하기'],
  },
  airplane: {
    question: '목이 마를 때 무엇을 부탁했나요?',
    options: ['Some water.', 'A new bag.', 'A book.'],
    answer: 0,
    hint: 'I am thirsty. Could I have some water, please?',
    explanation: 'thirsty는 목마른 상태이고, some water는 물을 뜻해요.',
    order: ['어른과 탑승구 확인하기', '기내에서 자리 찾아 앉기', '물 정중하게 부탁하기'],
  },
  laptop: {
    question: '노트북을 닫기 전에 무엇을 해야 하나요?',
    options: ['Move the table.', 'Save your work.', 'Open the window.'],
    answer: 1,
    hint: 'Please save your work before you close the laptop.',
    explanation: 'before는 ~하기 전에, save your work는 작업을 저장하라는 뜻이에요.',
    order: ['친구 차례 기다리기', '키보드로 이름 입력하기', '작업 저장하고 닫기'],
  },
  chair: {
    question: '처음 본 의자에 바로 앉지 않은 까닭은?',
    options: ['It has no legs.', 'It is raining.', 'Someone else is coming.'],
    answer: 2,
    hint: 'Is someone sitting here? Yes. My friend is coming.',
    explanation: '친구가 올 자리라고 해서 다른 빈 의자를 물었어요.',
    order: ['자리 주인이 있는지 묻기', '다른 빈 의자 확인하기', '허락을 받고 앉기'],
  },
  bowl: {
    question: '식탁을 차리기 전에 먼저 하는 것은?',
    options: ['Wash our hands.', 'Touch the hot pot.', 'Put bags on the table.'],
    answer: 0,
    hint: 'Let us wash our hands first.',
    explanation: 'first는 먼저라는 뜻이에요. 식탁을 준비하기 전에 손을 씻어요.',
    order: ['손 씻기', '그릇과 숟가락 준비하기', '식사 뒤 정리 돕기'],
  },
  sign: {
    question: '사진 속 표지판이 알려 주는 것은?',
    options: ['A bus timetable.', 'The speed limit.', 'The name of a book.'],
    answer: 1,
    hint: 'It tells drivers the speed limit. It is not a stop sign.',
    explanation: '속도 제한을 알려 주는 표지판이에요. stop sign과 구별해요.',
    order: ['어른과 표지판 살펴보기', '횡단보도 찾기', '안전한지 함께 확인하고 건너기'],
  },
  building: {
    question: '새 건물에 도착한 아이들은 누구와 함께 움직이나요?',
    options: ['A bus driver.', 'A pilot.', 'Their teacher.'],
    answer: 2,
    hint: 'We visit a new building with our teacher. We stay together.',
    explanation: 'with our teacher는 우리 선생님과 함께라는 뜻이에요.',
    order: ['선생님과 건물 방문하기', '입구로 가는 길 묻기', '함께 기다렸다가 안으로 들어가기'],
  },
  window: {
    question: '창문을 안전하게 연 사람은 누구인가요?',
    options: ['An adult.', 'A child alone.', 'A train driver.'],
    answer: 0,
    hint: 'The adult checks the window and opens it safely.',
    explanation: 'an adult는 어른 한 명이에요. 아이 혼자 창문을 열지 않았어요.',
    order: [
      '신선한 공기를 원해서 도움 청하기',
      '어른이 창문 열기',
      '비가 오자 닫아 달라고 부탁하기',
    ],
  },
};
export const words: Word[] = data.map((d) => {
  const detail = details[d.id];
  const rotated = [detail.order[1], detail.order[0], detail.order[2]];
  return {
    ...d,
    photo: `/english-photos/${d.photoId}.jpg`,
    sentences: [...d.sentences],
    translations: [...d.translations],
    alternate: [...d.alternate],
    alternateTranslations: [...d.alternateTranslations],
    glossary: d.glossary.map((g) => ({ ...g })),
    story: {
      ...d.story,
      pages: [...d.story.pages],
      translations: [...d.story.translations],
      questions: [
        {
          question: detail.question,
          options: detail.options,
          answer: detail.options[detail.answer],
          hint: detail.hint,
          explanation: detail.explanation,
        },
        {
          question: '대화 상황의 순서로 알맞은 것은?',
          options: [
            detail.order.join(' → '),
            rotated.join(' → '),
            [...detail.order].reverse().join(' → '),
          ],
          answer: detail.order.join(' → '),
          hint: '대화의 처음부터 마지막까지 다시 읽어 보세요.',
          explanation: detail.order.join(' → '),
        },
      ],
    },
  };
});
export const categories = ['전체', '집에서', '학교에서', '밖에서'] as const;
export function findWord(input: string) {
  const normalized = input.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  return words.find(
    (w) =>
      w.name === normalized ||
      w.korean === normalized ||
      w.glossary.some((g) => g.term === normalized),
  );
}
export function makeQuiz(word: Word): Question[] {
  const others = words.filter((w) => w.id !== word.id);
  const choices = [word.name, ...others.slice(0, 2).map((w) => w.name)];
  const questions: Question[] = [
    {
      question: '사진 속 사물을 영어로 골라 보세요.',
      options: choices,
      answer: word.name,
      hint: word.meaning,
      explanation: `${word.name}는 ‘${word.korean}’라는 뜻이에요.`,
      photo: true,
    },
    {
      question: '빈칸에 알맞은 영어 낱말을 골라 보세요.',
      sentence: word.sentences[0].replace(new RegExp(word.name, 'i'), '____'),
      options: choices,
      answer: word.name,
      hint: word.translations[0],
      explanation: `${word.sentences[0]} — ${word.translations[0]}`,
    },
    {
      question: '이 영어 표현의 뜻은 무엇일까요?',
      sentence: word.sentences[2],
      options: [word.translations[2], others[0].translations[0], others[1].translations[1]],
      answer: word.translations[2],
      hint: '상황 영어에서 배운 표현을 떠올려 보세요.',
      explanation: `${word.sentences[2]} — ${word.translations[2]}`,
    },
    ...word.story.questions,
  ];
  return questions.map((q, i) => {
    const offset = (i + word.id.length) % q.options.length;
    return { ...q, options: [...q.options.slice(offset), ...q.options.slice(0, offset)] };
  });
}
