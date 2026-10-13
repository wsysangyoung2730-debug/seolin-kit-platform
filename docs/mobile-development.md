# 모바일 개발 안내

## 실행

Node.js 22.13 이상(검증 기준 24), pnpm 11.25.0을 사용한다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Expo 개발 서버의 QR로 지원되는 Expo Go에서 열거나, Android Studio·Xcode가 설치된 환경에서 `pnpm --filter @seolin/mobile android` / `ios`를 실행한다. Expo Go와 프로젝트 SDK 호환성을 확인한다. 네이티브 설치 파일 생성에는 별도 Android/iOS 빌드 환경 또는 EAS 설정이 필요하다.

```sh
pnpm web        # 개발 검증용 브라우저 화면 (최종 PC 서비스 아님)
pnpm check      # TypeScript와 등록된 테스트
pnpm export     # Android/iOS/Web JavaScript 번들 생성
```

`export`는 APK/IPA 생성이나 스토어 출시 검증이 아니다. 기기 권한, 회전, 음향, 백그라운드 복귀, TV 미러링은 실제 Android·iPhone에서 따로 확인한다.

## 경계

- `apps/mobile`: Expo Router 기반 플랫폼 화면 및 네이티브 기기 연결
- `packages/contracts`: 미니앱 목록·상태·향후 서버 권한 응답의 데이터 계약
- `packages/design-tokens`: 서린 브랜드색과 공통 시각 기준
- 첫 O/X는 앱다운 상호작용과 가로 진행을 위해 네이티브 화면으로 재구성한다. 향후 HTML 미니앱용 WebView 실행기는 별도 구현한다.
- `com.seolin.kit.dev`는 개발용 식별자다. 스토어 계정과 최종 번들 ID, 서명·도메인은 아직 연결하지 않았다.
- 서버·회원·결제·실시간 인기 집계는 이 단계에서 운영하지 않는다. 앱에 비밀키를 넣지 않는다.

## 의존성 기준

Expo 57의 안정 버전과 해당 SDK에 맞는 React Native 조합을 사용한다. Expo의 `bundledNativeModules.json`과 `expo install --check`로 호환 범위를 확인한다.

- [Expo SDK 기준](https://docs.expo.dev/versions/latest/)
- [Expo monorepo 설정](https://docs.expo.dev/guides/monorepos/)

## 출시 전 별도 확인

- [ ] 실제 Android·iPhone·태블릿에서 화면과 접근성 확인
- [ ] 게임 가로 화면·음향·잠금 복귀·TV 미러링 확인
- [ ] 정식 아이콘 확정, Android adaptive/monochrome 아이콘 준비
- [ ] 스토어 식별자·서명·개인정보·구독·계정 삭제 정책 연결

## 플랫폼 화면 검증

- 홈 / 미니앱 / 내 앱 / 마이 및 미니앱 상세 화면을 제공한다.
- 목록 이름·아이콘은 상세, `시작`은 O/X 준비 화면으로 이동한다.
- 보관함은 저장 성공 후에만 화면에 반영하고, 로딩·오류 시 덮어쓰지 않는다.
- 검색·카테고리 조합과 손상된 보관함 데이터는 단위 테스트로 검증한다.
- 브라우저 390×844에서 상세 표시와 보관함 추가 후 재접속 유지 확인. 실제 기기 뒤로가기·접근성은 별도 확인한다.
- 현재 O/X 준비 화면은 다음 게임 구현 PR에서 연결한다. 나머지 미니앱은 실행을 막고 준비 중으로 표시한다.
