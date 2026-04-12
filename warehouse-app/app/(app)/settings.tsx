import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiBaseUrl } from '@/src/services/api';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.label, { color: theme.icon }]}>API đang dùng</Text>
      <Text style={[styles.value, { color: theme.text }]} selectable>
        {getApiBaseUrl()}
      </Text>
      <Text style={[styles.note, { color: theme.icon }]}>
        Đặt biến EXPO_PUBLIC_API_BASE_URL (ví dụ http://192.168.1.10:8080/api) rồi khởi động lại Expo. URL dạng …/api không ghi cổng sẽ được gợi ý thành cổng 8080 (Spring mặc định).
      </Text>
      <Text style={[styles.label, { color: theme.icon, marginTop: 24 }]}>Phiên bản ứng dụng</Text>
      <Text style={[styles.value, { color: theme.text }]}>
        {Constants.expoConfig?.version ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
});
