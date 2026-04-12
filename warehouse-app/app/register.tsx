import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import * as authApi from '@/src/services/authService';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Điền đủ các trường để tạo tài khoản.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await signIn({
        token: data.token,
        userId: data.userId,
        username: data.username,
      });
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? String((e as { response?: { data?: unknown } }).response?.data ?? 'Đăng ký thất bại')
          : 'Không thể kết nối máy chủ.';
      Alert.alert('Lỗi đăng ký', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        <Text style={styles.label}>Tên đăng nhập</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#64748b"
        />
        <Pressable
          style={({ pressed }) => [styles.submit, pressed && styles.pressed, busy && styles.disabled]}
          onPress={onSubmit}
          disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.submitText}>Tạo tài khoản</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
    padding: 24,
    justifyContent: 'center',
  },
  form: {
    gap: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
    backgroundColor: '#111827',
  },
  submit: {
    marginTop: 20,
    backgroundColor: '#34d399',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#052e16',
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
});
