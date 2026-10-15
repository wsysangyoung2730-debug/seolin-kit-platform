# 태권뽑기 생성 에셋 C — 도복·메달·호랑이

- 생성 도구: 내장 `image_gen` (`image_gen__imagegen`), 각 에셋별 1회 생성.
- 모든 요청에서 `transparent_background: true`를 지정했다. CLI/API 대체 도구는 사용하지 않았다.
- 요청은 1024×1024였으나 도구 반환 원본은 세 이미지 모두 1254×1254 RGBA이다. 원본을 변경하지 않고 프로젝트에 복사했다.
- 실제 alpha 범위 0~255 및 완전 투명 픽셀을 확인했다. 그림의 피사체·표정·구성·글자 및 배경 없음은 생성 결과를 직접 보고 검수했다.
- 프롬프트의 10% 여백과 달리 상하 주요 피사체 여백은 약 3~5%다. 앱에서 `contain`과 컨테이너 여백을 사용해 충분한 주변 공간을 확보한다.
- 원본 색상·해상도·알파를 보존했으며 별도의 이미지 편집은 하지 않았다.

## uniforms.png

프로젝트: `apps/mobile/assets/lucky/uniforms.png`

생성 원본: `/Users/sangyoung/.codex/generated_images/01a13dfe-c515-7940-bd30-7c360bd13d54/exec-8f302ecf-b906-410b-ae74-ad33f0a668dc.png`

최종 프롬프트:

```text
Use case: illustration-story
Asset type: transparent game illustration for the SEOLIN TOOL classroom miniapp.
Primary request: One complete white taekwondo uniform on a simple natural wooden clothes hanger, straight-on front view. The white dobok has a deep navy-black belt tied neatly at the waist and exactly one small front pocket for a hidden paper note. Show the entire jacket, belt and trousers as one clean, complete outfit on the hanger. No person or body inside.
Style/medium: Premium 2D children's picture-book illustration, soft hand-painted shading, tactile fabric and gentle rounded forms, polished mobile-game asset with a bold clear silhouette. This is an illustration, not photography or a 3D render.
Composition/framing: Square 1024x1024, centered subject, approximately 10% empty transparent margin on every edge, no cropping. The outfit should be readable at small mobile sizes.
Lighting/mood: Clean, cozy and reassuring, softly lit.
Color palette: white and warm cream fabric, deep navy #202D78 belt, warm natural wooden hanger, very subtle coral/gold accents if needed in existing details only.
Scene/backdrop: Genuine transparent alpha background. All pixels outside the isolated outfit and hanger must be transparent.
Constraints: No letters, numbers, brand marks, logos, labels, UI, captions or watermark. No background, floor, scenery, background shadow or decorative extra objects. Preserve empty space around the silhouette.
```

## medals.png

프로젝트: `apps/mobile/assets/lucky/medals.png`

생성 원본: `/Users/sangyoung/.codex/generated_images/01a13dfe-c515-7940-bd30-7c360bd13d54/exec-036ef09e-cfaf-4dfb-9209-a4d7fc9ad4f1.png`

최종 프롬프트:

```text
Use case: illustration-story
Asset type: transparent game illustration for the SEOLIN TOOL classroom miniapp.
Primary request: A single golden taekwondo reward medal, straight-on front view, with a short deep-navy ribbon above it. The large central circular face is mostly blank and smooth, with one small embossed star near the lower area. The medal has NO face, no character, no letters, no numbers, no logo.
Style/medium: Premium 2D children's picture-book illustration, gentle hand-painted shading with tactile metallic highlights and a softly rounded clear silhouette. A polished friendly mobile-game asset, not photography and not a 3D render.
Composition/framing: Square 1024x1024, one centered object filling about 75-80% of the canvas, at least 10% clear empty transparent margin on every edge. Entire medal and short ribbon visible; no cropping.
Lighting/mood: Warm celebratory reflections painted on the gold itself, elegant and welcoming rather than dazzling. Keep the broad center usable for a later app overlay.
Color palette: rich warm gold, warm cream highlights, navy #202D78 short ribbon, tiny restrained coral accent on the ribbon if useful.
Scene/backdrop: Genuine transparent alpha background. All pixels outside the medal and its attached ribbon must be transparent.
Constraints: No text, no UI, no watermark, no decorative external stars or confetti, no background, floor, surrounding glow or drop shadow. No face or humanoid features.
```

## tiger.png

프로젝트: `apps/mobile/assets/lucky/tiger.png`

생성 원본: `/Users/sangyoung/.codex/generated_images/01a13dfe-c515-7940-bd30-7c360bd13d54/exec-3348f7dd-39ac-482f-ae2d-6e7f4a09ccfb.png`

최종 프롬프트:

```text
Use case: illustration-story
Asset type: transparent character illustration for the SEOLIN TOOL classroom miniapp.
Primary request: One original baby tiger taekwondo instructor character, full body facing forward. A warm apricot-orange tiger cub with soft darker-orange stripes, round cream muzzle and belly, tiny rounded ears and a short visible tail. The tiger wears a clean white taekwondo dobok and deep-navy #202D78 belt. Its expression is kind and slightly sleepy, with gently lowered eyelids, a tiny relaxed smile, no aggression. One paw holds a small deep-navy drawstring lucky pouch tied with a thin gold cord. Show all paws/feet and ears fully.
Style/medium: Premium 2D children's picture-book illustration, softly hand-painted with tactile plush fur and woven cloth, subtle rounded shading, appealing clear silhouette. Polished mobile classroom-game character. Original design; do not imitate any known mascot or franchise. Not photography and not a 3D render.
Composition/framing: Square 1024x1024, centered character occupying 75-80% of the canvas, at least 10% transparent breathing room around all edges. Full body, no cropping. Keep the silhouette simple and readable on a small screen.
Lighting/mood: Gentle, cozy, friendly and reassuring, suitable for young children.
Color palette: warm apricot-orange, cream, white, deep navy #202D78 and restrained gold, with a very subtle coral cheek tint.
Scene/backdrop: Genuine transparent alpha background. All pixels outside the character and its held pouch must be transparent.
Constraints: No letters, numbers, symbols, logos, UI, watermark or text. No background, floor, surrounding glow, drop shadow, extra props, extra characters, weapons, sharp teeth, fighting pose or intimidating expression.
```

