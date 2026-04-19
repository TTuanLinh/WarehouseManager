import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as userApi from '@/src/services/userService';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const dark = colorScheme === 'dark';
  const [profile, setProfile] = useState<userApi.UserProfile | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const logout = async () => {
    await signOut();
  };

  useFocusEffect(
    useCallback(() => {
      if (session == null) {
        setProfile(null);
        return;
      }
      let cancelled = false;
      void (async () => {
        try {
          const { data } = await userApi.getMyProfile();
          if (!cancelled) setProfile(data ?? null);
        } catch {
          if (!cancelled) setProfile(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [session])
  );

  const pickBankQrImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh để chọn ảnh mã QR ngân hàng.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.88,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingQr(true);
    try {
      let uri = asset.uri;
      // Android thường trả content:// — axios/RN đọc multipart không ổn định; copy ra file:// trong cache.
      const needsCopy =
        (Platform.OS === 'android' && uri.startsWith('content://')) ||
        uri.startsWith('ph://') ||
        uri.startsWith('assets-library://');
      if (needsCopy && cacheDirectory) {
        const dest = `${cacheDirectory}wm-bank-qr-${Date.now()}.jpg`;
        await copyAsync({ from: uri, to: dest });
        uri = dest;
      }

      const mime =
        ('mimeType' in asset && typeof asset.mimeType === 'string' && asset.mimeType) ||
        (uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const fileName =
        ('fileName' in asset && typeof asset.fileName === 'string' && asset.fileName) ||
        (mime === 'image/png' ? 'bank-qr.png' : 'bank-qr.jpg');

      const form = new FormData();
      form.append('file', { uri, name: fileName, type: mime } as never);
      const { data } = await userApi.uploadBankQrImage(form);
      setProfile(data ?? null);
      Alert.alert(
        'Đã lưu',
        'Máy chủ đã đọc nội dung QR trong ảnh (OpenCV). Người mua sẽ thấy mã QR này khi đơn ở trạng thái chờ thanh toán.'
      );
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không tải được ảnh hoặc không đọc được mã QR.'));
    } finally {
      setUploadingQr(false);
    }
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

  const hasQr = profile?.hasBankQr === true;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: dark ? '#1e293b' : '#f1f5f9' }]}>
        <Text style={[styles.label, { color: theme.icon }]}>Tên đăng nhập</Text>
        <Text style={[styles.value, { color: theme.text }]}>{session.username}</Text>
        <Text style={[styles.label, { color: theme.icon, marginTop: 16 }]}>Mã người dùng</Text>
        <Text style={[styles.value, { color: theme.text }]}>{session.userId}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: dark ? '#1e293b' : '#f1f5f9' }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>QR ngân hàng (người bán)</Text>
        <Text style={[styles.hintBlock, { color: theme.icon }]}>
          Tải ảnh chụp hoặc file ảnh chứa mã QR tài khoản ngân hàng của bạn. Hệ thống dùng OpenCV để đọc nội dung QR
          và lưu lại. Khi có đơn ở trạng thái chờ thanh toán, người mua sẽ thấy mã QR này (cùng nội dung đã đọc từ ảnh
          của bạn).
        </Text>
        <Text style={{ color: hasQr ? '#16a34a' : theme.icon, fontWeight: '600', marginBottom: 10 }}>
          {hasQr ? 'Đã cấu hình mã QR ngân hàng.' : 'Chưa có mã QR — hãy chọn ảnh.'}
        </Text>
        {uploadingQr ? (
          <ActivityIndicator color={theme.tint} style={{ marginVertical: 8 }} />
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}
            onPress={() => void pickBankQrImage()}>
            <Text style={styles.btnPrimaryText}>{hasQr ? 'Đổi ảnh QR ngân hàng' : 'Chọn ảnh QR ngân hàng'}</Text>
          </Pressable>
        )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
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
  hintBlock: { fontSize: 14, lineHeight: 21, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  btnPrimary: {
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
