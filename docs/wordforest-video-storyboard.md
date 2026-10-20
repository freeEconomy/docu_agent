# 단어숲 영상 제작 초안

현재 실제 생성된 영상은 없다. 아래는 사과 동화를 위한 6장면 제작 프롬프트이며 영상 자체가 아니다. 영상 생성 도구의 무료 이용량, 상업적 이용·아동용 콘텐츠·재배포 조건은 제작 시 확인한다. 생성 영상을 사전에 검토하고 MP4로 저장하면 학습자의 이용 시 AI API를 호출할 필요가 없다. 아이의 실제 이름이나 사진을 제작 도구에 입력하지 않는다.

권장 제작 방식: 장면당 약 6~10초, 음성과 자막은 생성 모델에 맡기지 않고 사이트의 본문/브라우저 읽기로 제공. 짧은 영상은 이야기 전체를 읽는 시간을 대체하지 않고 분위기와 단서를 보여 준다. 자동재생·반복재생을 피하고 아이가 직접 재생한다. 선택한 스타일은 영화 같은 3D 애니메이션이다. 동일한 주인공·의상·장소의 기준 이미지를 사용한다.

공통 지시: 가을 과수원을 배경으로 하는 차분하고 영화적인 교육용 장면. 장면의 행동은 명확하고 카메라는 천천히 움직인다. 과장된 아기 동물, 번쩍이는 효과, 빠른 컷 전환, 영상 안에 생성한 글자·상표를 사용하지 않는다. 위험한 가지 타기, 아이 혼자 사다리 사용, 도구를 휘두르는 행동을 보여 주지 않는다. 실제 아이의 얼굴이나 개인정보를 사용하지 않는다. 아이와 농부는 허구의 인물이며, 이야기를 사람 등장인물로 각색할 경우 본문도 함께 맞춘다.

1. **발단**: 가을 아침의 과수원. 잎 사이로 햇빛이 들어오고 잘 익은 사과가 보인다. 빈 바구니와 농부의 손을 차례로 보여 주며 협동 수확을 준비한다.
2. **문제**: 높은 가지에 남은 사과와 아래의 빈 바구니를 교차해 보여 준다. 누군가 올라가거나 가지를 흔드는 대신 멈추고 어른에게 도움을 구한다.
3. **탐색**: 농부가 긴 손잡이의 과일 수확기를 안전하게 사용한다. 친구들은 떨어진 과일 아래에 서지 않고, 건네받은 사과를 안정된 바구니에 옮겨 담는다.
4. **전환**: 바구니 옆에 놓인 작은 흠집의 사과를 가까이 보여 준다. 실수를 비난하거나 숨기는 분위기 대신 농부에게 보여 주고 상태를 확인한다.
5. **해결**: 어른의 손이 씻은 사과를 조리대에서 손질한다. 어린이는 칼과 불에서 떨어져 있다. 완성된 사과 조림과 신선한 사과 접시를 보여 준다.
6. **성장**: 축제 식탁에서 음식을 나누고, 과수원으로 다시 시선을 옮긴다. 빈 바구니와 따뜻한 빛으로 함께 이룬 성취를 표현한다.

영상별 최종 점검: 본문 내용과 등장인물의 일관성, 손과 도구의 형태, 위험 행동·왜곡·불필요한 글자 유무, 자막이 있다면 정확성과 읽을 시간, 재생 파일의 크기와 호환성.

파일 예시: public/story-videos/apple/chapter-1.mp4 → storyVideos.apple의 0번 항목. 소유·사용 권리가 확인된 실제 파일만 등록한다.

## 확정한 시각 스타일: 영화 같은 3D 애니메이션

공통 제작 프롬프트:

> Cinematic stylized 3D animation for a seven-year-old reader. A fictional seven-year-old child explorer, short dark hair, a teal outdoor jacket, mustard backpack, practical sneakers. Natural child proportions, expressive but restrained acting; not a toddler mascot, not chibi, no anthropomorphic baby animals. Friends Harin, Junho and Jiwoo wear distinct muted outdoor colors and keep the same appearance across every shot. A spacious autumn orchard, detailed leaves, weathered wooden baskets, warm volumetric sunlight, believable materials and gentle depth of field. Clear educational action, slow deliberate camera motion, no rapid cuts, no flashing lights, no frightening imagery. No text, subtitles, logos or generated dialogue inside the video. Show adult supervision for harvesting and food preparation. Render only the action specified for this chapter, without inventing later events. Landscape 16:9, approximately 8 seconds per shot.

각 장면의 공통 캐릭터/배경 기준 이미지를 먼저 확정한 뒤 위 공통 지시와 1~6번 장면 설명을 조합한다. 한 번에 6장면 전체를 생성하는 대신 장면별로 검토한다. 프레임에 실제 어린이 사진, 실명, 음성을 업로드하지 않는다. 현재 본문의 주요 친구들도 준호·하린·지우·도윤 등 어린이 등장인물로 맞추었다. 캐릭터 꾸미기의 동물 아바타는 학습 프로필용이며 영상 주인공과 동일하다고 표시하지 않는다.
