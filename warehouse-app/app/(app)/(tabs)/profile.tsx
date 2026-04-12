import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const dark = colorScheme === 'dark';

  const logout = async () => {
    await signOut();
  };

  if (session == null) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.hint, { color: theme.icon }]}>
          Đăng nhập hoặc tạo tài khoản để quản lý kho và giao dịch.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.push('/login')}>
          <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            { borderColor: dark ? '#475569' : '#cbd5e1' },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/register')}>
          <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Đăng ký</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: dark ? '#1e293b' : '#f1f5f9' }]}>
        <Text style={[styles.label, { color: theme.icon }]}>Tên đăng nhập</Text>
        <Text style={[styles.value, { color: theme.text }]}>{session.username}</Text>
        <Text style={[styles.label, { color: theme.icon, marginTop: 16 }]}>Mã người dùng</Text>
        <Text style={[styles.value, { color: theme.text }]}>{session.userId}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.linkBtn,
          { borderColor: dark ? '#334155' : '#cbd5e1' },
          pressed && styles.pressed,
        ]}
        onPress={() => router.push('/(app)/settings')}>
        <Text style={[styles.linkText, { color: theme.text }]}>Cài đặt</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}
        onPress={logout}>
        <Text style={styles.dangerText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: '#38bdf8',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '600',
  },
  btnSecondary: {
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 17,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  linkBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerBtn: {
    marginTop: 8,
    backgroundColor: '#b91c1c',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: { opacity: 0.88 },
});
