import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function OrdersPlaceholderScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Đơn hàng</Text>
      <Text style={[styles.body, { color: theme.icon }]}>
        Tính năng đặt hàng / quản lý đơn sẽ được bổ sung sau. Tab này giữ sẵn chỗ trong điều hướng.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});
