import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as userApi from '@/src/services/userService';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const bg = dark ? '#080f1c' : '#f8fafc';
  const surface = dark ? '#0d1b2e' : '#ffffff';
  const border = dark ? '#1e3a5f' : '#e2e8f0';

  const [profile, setProfile] = useState<userApi.UserProfile | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!session) { setProfile(null); return; }
    let cancelled = false;
    void (async () => {
      try { const { data } = await userApi.getMyProfile(); if (!cancelled) setProfile(data ?? null); }
      catch { if (!cancelled) setProfile(null); }
    })();
    return () => { cancelled = true; };
  }, [session]));

  const pickBankQrImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.88 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingQr(true);
    try {
      let uri = asset.uri;
      const needsCopy = (Platform.OS === 'android' && uri.startsWith('content://')) || uri.startsWith('ph://') || uri.startsWith('assets-library://');
      if (needsCopy && cacheDirectory) {
        const dest = `${cacheDirectory}wm-bank-qr-${Date.now()}.jpg`;
        await copyAsync({ from: uri, to: dest });
        uri = dest;
      }
      const mime = ('mimeType' in asset && typeof asset.mimeType === 'string' && asset.mimeType) || (uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const fileName = ('fileName' in asset && typeof asset.fileName === 'string' && asset.fileName) || (mime === 'image/png' ? 'bank-qr.png' : 'bank-qr.jpg');
      const form = new FormData();
      form.append('file', { uri, name: fileName, type: mime } as never);
      const { data } = await userApi.uploadBankQrImage(form);
      setProfile(data ?? null);
      Alert.alert('Đã lưu', 'Máy chủ đã đọc nội dung QR trong ảnh. Người mua sẽ thấy mã QR này khi thanh toán.');
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không tải được ảnh hoặc không đọc được mã QR.'));
    } finally { setUploadingQr(false); }
  };

  /* ─── Chưa đăng nhập ─── */
  if (!session) {
    return (
      <View style={[styles.guestRoot, { backgroundColor: bg }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: dark ? '#0f2040' : '#eff6ff' }]}>
          <MaterialIcons name="person" size={40} color="#38bdf8" />
        </View>
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint, { color: theme.icon }]}>Đăng nhập để quản lý kho và giao dịch.</Text>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, { borderColor: border }, pressed && { opacity: 0.88 }]} onPress={() => router.push('/register')}>
          <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Tạo tài khoản mới</Text>
        </Pressable>
      </View>
    );
  }

  const hasQr = profile?.hasBankQr === true;
  const initials = (session.username ?? '?').slice(0, 2).toUpperCase();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={[styles.avatar, { backgroundColor: dark ? '#0f2040' : '#eff6ff', borderColor: '#38bdf8' }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={[styles.username, { color: theme.text }]}>{session.username}</Text>
          <Text style={[styles.userId, { color: theme.icon }]}>ID: {session.userId}</Text>
        </View>
      </View>

      {/* QR section */}
      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="qr-code" size={20} color="#38bdf8" style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>QR ngân hàng (người bán)</Text>
        </View>
        <Text style={[styles.cardDesc, { color: theme.icon }]}>
          Tải ảnh QR tài khoản ngân hàng. Người mua sẽ thấy mã này khi đơn ở trạng thái chờ thanh toán.
        </Text>
        <View style={[styles.qrStatus, { backgroundColor: hasQr ? (dark ? '#052e16' : '#f0fdf4') : (dark ? '#1a0a00' : '#fff7ed'), borderColor: hasQr ? '#34d399' : '#fbbf24' }]}>
          <MaterialIcons name={hasQr ? 'check-circle' : 'warning-amber'} size={16} color={hasQr ? '#34d399' : '#fbbf24'} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: hasQr ? '#34d399' : '#fbbf24' }}>
            {hasQr ? 'Đã cấu hình mã QR ngân hàng' : 'Chưa có mã QR — hãy chọn ảnh'}
          </Text>
        </View>
        {uploadingQr ? (
          <ActivityIndicator color="#38bdf8" style={{ marginTop: 12 }} />
        ) : (
          <Pressable style={({ pressed }) => [styles.accentBtn, pressed && { opacity: 0.88 }]} onPress={() => void pickBankQrImage()}>
            <MaterialIcons name="upload" size={18} color="#0b1a2b" style={{ marginRight: 6 }} />
            <Text style={styles.accentBtnText}>{hasQr ? 'Đổi ảnh QR' : 'Chọn ảnh QR'}</Text>
          </Pressable>
        )}
      </View>

      {/* Settings link */}
      <Pressable
        style={({ pressed }) => [styles.linkRow, { backgroundColor: surface, borderColor: border }, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/(app)/settings')}>
        <MaterialIcons name="settings" size={20} color={theme.icon} style={{ marginRight: 12 }} />
        <Text style={[styles.linkText, { color: theme.text }]}>Cài đặt</Text>
        <MaterialIcons name="chevron-right" size={22} color={dark ? '#334155' : '#cbd5e1'} />
      </Pressable>

      {/* Logout */}
      <Pressable style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.88 }]} onPress={signOut}>
        <MaterialIcons name="logout" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.dangerText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  guestRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  guestTitle: { fontSize: 22, fontWeight: '800' },
  guestHint: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  primaryBtn: { backgroundColor: '#38bdf8', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#0b1a2b', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#38bdf8' },
  username: { fontSize: 20, fontWeight: '800' },
  userId: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  qrStatus: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 14 },
  accentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38bdf8', borderRadius: 12, paddingVertical: 11 },
  accentBtnText: { color: '#0b1a2b', fontWeight: '700', fontSize: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#b91c1c', borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  dangerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
