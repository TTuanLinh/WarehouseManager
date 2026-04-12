import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/src/services/api';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { loading, session } = useAuth();
  const sentToAppForUserId = useRef<number | null>(null);

  const userId = session?.userId;

  useEffect(() => {
    if (loading || userId == null) {
      sentToAppForUserId.current = null;
      return;
    }
    if (sentToAppForUserId.current === userId) return;
    sentToAppForUserId.current = userId;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      router.replace('/(app)/(tabs)');
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [loading, userId]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingHint}>Đang tải…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>Warehouse Manager</Text>
        <Text style={styles.subtitle}>Quản lý kho và tồn kho trên điện thoại</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.push('/login' as const)}>
          <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => router.push('/register' as const)}>
          <Text style={styles.btnSecondaryText}>Đăng ký</Text>
        </Pressable>
      </View>

      <Text style={styles.apiHint} selectable>
        API: {getApiBaseUrl()}
      </Text>
      <Text style={styles.apiSubhint}>
        Máy thật: dùng IP máy tính + cổng 8080 (ví dụ http://192.168.1.5:8080/api). Giả lập Android:
        10.0.2.2 thay cho localhost.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    minHeight: 520,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1220',
    gap: 12,
  },
  loadingHint: {
    color: '#94a3b8',
    fontSize: 15,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 12,
    marginTop: 32,
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
    borderColor: '#334155',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  btnSecondaryText: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
  apiHint: {
    marginTop: 28,
    fontSize: 12,
    color: '#64748b',
  },
  apiSubhint: {
    marginTop: 6,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
