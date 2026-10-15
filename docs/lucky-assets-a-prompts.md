# 태권뽑기 생성 에셋 A

기성 이미지 다운로드 대신 내장 image_gen으로 직접 생성한다. 3D 모델을 사용하기로 보류한 운명의 띠·격파 한 판·띠 핀볼은 생성 범위에서 제외한다. 앱은 2D 이미지에 네이티브 회전·이동·공개 동작을 적용한다.

공통 프롬프트: Use case: stylized-concept. Asset type: transparent PNG game object for a Korean taekwondo classroom app. Premium original 2D storybook illustration with soft sculpted shading and tactile painted detail, crisp readable silhouette at mobile size. Seolin navy #202D78, creamy white, restrained coral and warm gold. Single centered isolated object, square canvas, 10 percent safe margins. Truly transparent background. No backdrop, ground plane, UI, text, numbers, watermark or borrowed mascot. Not a 3D model or a screenshot.

## capsule.png

Subject: one playful capsule vending machine shaped like a taekwondo dobok torso. White V-neck uniform casing, navy collar and belt across the middle, rounded clear upper globe with a few pastel capsules visible inside. A coral kick-target button at lower right, a dark capsule dispensing hatch at lower center. View nearly straight on with slight dimensional side shading, whole machine visible. Cheerful polished toy-store mood, simple bold shapes. Do not include a detached capsule outside the machine, hands, people or lettering.

## roulette.png

Subject: a perfectly circular front-facing spinning wheel, exactly six equal radial sectors in taekwondo belt colors creamy white, golden yellow, mint green, azure blue, coral red, deep navy. Rounded navy outer rim with subtle gold detailing, small cream central hub. Light tactile lacquer texture, premium playful sports-festival mood. The circle must be centered and symmetrical, viewed perpendicular to camera. No pointer, stand, arrows, characters, prize icons, text or numbers outside or inside the wheel. Entire circle visible with ample transparent margin.

## rotating.png

Subject: one intact rectangular taekwondo wooden breaking board viewed straight-on, warm honey maple wood grain, gently beveled edges and soft painted highlights. Four corners slightly rounded, no cracks yet, no hands or supports. A small embossed navy belt-shaped emblem at center without letters. Wide horizontal board occupying central 75 percent width, clean child-friendly martial arts equipment illustration, confident sporty mood. Transparent surroundings, no debris or extra boards.

## 생성 기록

- 방식: 내장 image_gen, 각 에셋 독립 호출, transparent_background=true
- capsule 원본: /Users/sangyoung/.codex/generated_images/01a1345f-3ceb-7151-a264-b142db4d1ffc/exec-15f13cc8-1898-4605-a758-57e9b9359615.png
- roulette 원본: /Users/sangyoung/.codex/generated_images/01a1345f-3ceb-7151-a264-b142db4d1ffc/exec-ae9d2fa5-ea43-42bd-a2c2-3190d6c31613.png
- 두 파일 모두 1254×1254 RGBA, alpha 0~255를 확인하고 원본 픽셀을 보존해 앱 폴더에 복사했다.
- rotating 원본: /Users/sangyoung/.codex/generated_images/01a1345f-3ceb-7151-a264-b142db4d1ffc/exec-864e038d-3615-40da-ae31-c8ef9711ea30.png
- rotating은 1536×1024 RGBA다. 일부 미리보기가 투명 픽셀의 RGB를 갈색 배경처럼 표시했으나 실제 알파 검사에서 바깥 영역은 0임을 확인했다. 원본을 그대로 사용하며 배경 제거 편집 후보 2개는 채택하지 않았다.
