import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@seolin/design-tokens';

export default function Welcome() {
  return <View style={styles.page}><Text style={styles.title}>서린킷</Text><Text>수업에 필요한 도구, 한곳에</Text></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: 12 }, title: { fontSize: 32, fontWeight: '800', color: colors.brand } });
