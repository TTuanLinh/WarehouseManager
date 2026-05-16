import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as authApi from '@/src/services/authService';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await authApi.login(username.trim(), password);
      await signIn({
        token: data.token,
        userId: data.userId,
        username: data.username,
      });
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const msg = getAxiosErrorMessage(e, 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
      Alert.alert('Lỗi đăng nhập', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <MaterialIcons name="inventory" size={36} color="#38bdf8" />
          </View>
          <Text style={styles.appName}>WarehouseManager</Text>
          <Text style={styles.tagline}>Quản lý kho hàng thông minh</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSub}>Chào mừng bạn trở lại!</Text>

          {/* Username */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'username' && styles.inputRowFocused,
            ]}>
              <MaterialIcons name="person-outline" size={20} color={focusedField === 'username' ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#475569"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                editable={!busy}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'password' && styles.inputRowFocused,
            ]}>
              <MaterialIcons name="lock-outline" size={20} color={focusedField === 'password' ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#475569"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                editable={!busy}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={12}
                style={styles.eyeBtn}>
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitPressed,
              busy && styles.submitDisabled,
            ]}
            onPress={onSubmit}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.submitText}>Đăng nhập</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Go to register */}
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/register')}
            disabled={busy}>
            <Text style={styles.secondaryText}>Tạo tài khoản mới</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080f1c',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#0f2040',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
  },

  /* Card */
  card: {
    backgroundColor: '#0d1b2e',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },

  /* Field */
  fieldWrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1525',
    borderWidth: 1.5,
    borderColor: '#1e3a5f',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowFocused: {
    borderColor: '#38bdf8',
    backgroundColor: '#0b1e35',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#f1f5f9',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  /* Submit */
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#38bdf8',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPressed: { opacity: 0.88 },
  submitDisabled: { opacity: 0.55 },
  submitText: {
    color: '#0b1a2b',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e3a5f',
  },
  dividerText: {
    fontSize: 13,
    color: '#475569',
  },

  /* Secondary */
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },
});
