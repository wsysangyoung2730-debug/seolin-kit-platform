# 태권 뽑기 생성 에셋: 미트·사물함·두루마리

사용자가 요청한 컨셉에 맞춰 새로 생성한 PNG다. 외부 기성 에셋이나 기존 SVG의 단순 캡처를 사용하지 않았다.

- 생성 도구: 기본 제공 `image_gen.imagegen` (`image_gen__imagegen`), 에셋마다 독립 호출
- 생성 옵션: `transparent_background: true`, 참조 이미지 없음
- 요청 크기: 프롬프트에서 1024×1024를 요청했다.
- 실제 반환 크기: 세 파일 모두 **1254×1254 RGBA PNG**. 도구 원본의 해상도와 알파를 보존했고 크기 변경이나 픽셀 편집을 하지 않았다.
- 투명도 검사: 세 파일 모두 알파 최솟값 0·최댓값 255이며 완전 투명 픽셀이 존재한다.
- 검수: 저장소에 복사한 세 파일을 각각 직접 열어 개체 한 개, 완전한 외곽, 텍스트·워터마크 부재, 컨셉과 색상을 확인했다.
- 앱 내 애니메이션·실기기 렌더 검증은 이 에셋 생성 검수와 별개다.

## mitts.png

- 저장 경로: `apps/mobile/assets/lucky/mitts.png`
- 원본 출처: `/Users/sangyoung/.codex/generated_images/01a13dff-a151-73a0-bbfd-dbc50cd3abfd/exec-0c8ef6e6-0787-484a-a89e-2e2df445ad43.png`

최종 생성 프롬프트:

```text
Use case: illustration-story
Asset type: transparent PNG game asset for a mobile taekwondo classroom app.
Primary request: Create exactly one taekwondo kicking target mitt, front three-quarter view, coral red padded leather striking face and deep navy #202D78 trim, slender navy handle, neat visible stitching, sporty and lively.
Style/medium: sophisticated 2D picture-book illustration with soft dimensional shading, tactile painted detail and a clean bold silhouette; this is an illustrated game prop, not a 3D model render or photograph. Navy #202D78 identity with coral and warm cream highlights.
Composition: a single centered object in a 1024x1024 square with approximately 10 percent transparent padding around its full silhouette. Entire mitt and handle visible. Clear readable shape at small mobile size.
Background: genuine transparent alpha, no backdrop, no floor or cast shadow outside the object.
Constraints: no text, no numbers, no logos, no watermark, no interface, no frame, no extra objects, no hands or characters.
```

## lockers.png

- 저장 경로: `apps/mobile/assets/lucky/lockers.png`
- 원본 출처: `/Users/sangyoung/.codex/generated_images/01a13dff-a151-73a0-bbfd-dbc50cd3abfd/exec-45291d8a-0bf4-42c4-a8f7-924a534a41ed.png`

최종 생성 프롬프트:

```text
Use case: illustration-story
Asset type: transparent PNG game asset for a mobile taekwondo classroom app.
Primary request: Exactly ONE small taekwondo school locker compartment with one closed door, shown from the front with very subtle three-quarter depth. A deep navy #202D78 and muted lavender powder-coated metal door in a pale warm wood casing, simple small handle and tasteful ventilation slots. Friendly cozy school-toy mood, sturdy softly rounded corners.
Style/medium: sophisticated 2D children's picture-book illustration with soft painted dimensional shading and tactile detail, clearly illustrated rather than photorealistic; polished mobile game prop. Main palette deep navy #202D78, lavender, warm cream wood and tiny warm gold hardware.
Composition: one isolated centered compartment in a 1024x1024 square, approximately 10 percent transparent padding. Entire object visible, bold silhouette readable at small size. Not a wall of lockers: only one door and one compartment.
Background: genuinely transparent alpha, no floor, no room, no wall, no floating decorations or external cast shadow.
Constraints: no numbers, no letters, no labels, no text, no logo, no watermark, no interface, no frame, no people, no extra objects.
```

## scrolls.png

- 저장 경로: `apps/mobile/assets/lucky/scrolls.png`
- 원본 출처: `/Users/sangyoung/.codex/generated_images/01a13dff-a151-73a0-bbfd-dbc50cd3abfd/exec-e1e11c07-fc42-4dfd-b124-1e318266aab4.png`

최종 생성 프롬프트:

```text
Use case: illustration-story
Asset type: transparent PNG game asset for a mobile taekwondo classroom app.
Primary request: Exactly one Korean martial-arts promotion examination scroll, made of warm cream hanji paper with the two ends softly rolled around elegant slim golden rods. A deep navy #202D78 cord ties the scroll around its middle with a neat small knot. The center paper area is entirely blank. Calm refined traditional Korean mood.
Style/medium: sophisticated 2D picture-book illustration, soft hand-painted dimensional shading with subtle hanji fibers, elegant simplified shapes and large clean silhouette, not a photograph and not a 3D model. Palette cream, warm gold, navy #202D78 and extremely restrained coral details only if naturally needed.
Composition: one vertical scroll seen from a gentle front three-quarter angle, centered in a 1024x1024 square with approximately 10 percent transparent padding around the complete object. All rolled edges, rods and cord visible.
Background: genuinely transparent alpha, no scenery, no surface or external cast shadow.
Constraints: absolutely no writing, no calligraphy, no symbols, no stamp text, no numbers, no logo, no watermark, no UI, no frame, no hands, no extra objects.
```


