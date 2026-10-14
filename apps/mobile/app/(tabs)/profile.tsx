import { Image, Text, View } from "react-native";
import { Card, Copy, Page, Title, c, s } from "../../src/components/ui";
export default function Profile() {
  return (
    <Page>
      <Title>마이</Title>
      <Card>
        <View style={s.row}>
          <Image
            source={require("../../assets/seolin-kit-icon.png")}
            style={{ width: 56, height: 56, borderRadius: 14 }}
          />
          <View>
            <Text style={s.heading}>서린태권도</Text>
            <Text style={s.small}>기본 도장 · 기기에서 사용 중</Text>
          </View>
        </View>
        <Text style={s.badge}>Free</Text>
        <Copy>무료로 공개된 미니앱을 이용할 수 있어요.</Copy>
      </Card>
      <Card>
        <Text style={s.heading}>나만의 수업 도구함</Text>
        <Copy>
          회원가입과 내 도장 로고 설정은 준비 중이에요. 지금은 회원가입 없이 O/X
          수업을 시작할 수 있어요.
        </Copy>
      </Card>
      <Card>
        <Text style={s.heading}>앞으로 만날 플랜</Text>
        <Copy>Basic · 월 9,900원 선택한 미니앱 3~5개와 내 도장 로고</Copy>
        <Copy>Pro · 월 19,900원 전체 미니앱과 내 도장 로고, 광고 제거</Copy>
        <Text style={s.small}>
          현재 결제는 제공하지 않아요. 위 구성은 기획안으로, 공개 전 변경될 수
          있어요.
        </Text>
      </Card>
      <Text style={s.small}>서린툴 0.1.0 · 개발 버전</Text>
    </Page>
  );
}
