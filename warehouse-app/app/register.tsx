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

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận phải giống mật khẩu đã nhập.');
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
      const msg = getAxiosErrorMessage(e, 'Đăng ký thất bại. Kiểm tra lại thông tin.');
      Alert.alert('Lỗi đăng ký', msg);
    } finally {
      setBusy(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

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
            <MaterialIcons name="person-add" size={32} color="#34d399" />
          </View>
          <Text style={styles.appName}>Tạo tài khoản</Text>
          <Text style={styles.tagline}>Tham gia WarehouseManager ngay hôm nay</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Username */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'username' && styles.inputRowFocused,
            ]}>
              <MaterialIcons name="person-outline" size={20} color={focusedField === 'username' ? '#34d399' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="Tối thiểu 3 ký tự"
                placeholderTextColor="#475569"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                editable={!busy}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'email' && styles.inputRowFocused,
            ]}>
              <MaterialIcons name="email" size={20} color={focusedField === 'email' ? '#34d399' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor="#475569"
                onFocus={() => setFocusedField('email')}
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
              <MaterialIcons name="lock-outline" size={20} color={focusedField === 'password' ? '#34d399' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Tối thiểu 6 ký tự"
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

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'confirmPassword' && styles.inputRowFocused,
              passwordsMismatch && styles.inputRowError,
              passwordsMatch && styles.inputRowSuccess,
            ]}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={
                  passwordsMismatch ? '#f87171'
                  : passwordsMatch ? '#34d399'
                  : focusedField === 'confirmPassword' ? '#34d399'
                  : '#64748b'
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#475569"
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                editable={!busy}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={12}
                style={styles.eyeBtn}>
                <MaterialIcons
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>
            {passwordsMismatch && (
              <Text style={styles.errorHint}>
                <MaterialIcons name="error-outline" size={12} /> Mật khẩu không khớp
              </Text>
            )}
            {passwordsMatch && (
              <Text style={styles.successHint}>
                <MaterialIcons name="check-circle-outline" size={12} /> Mật khẩu khớp
              </Text>
            )}
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
              <ActivityIndicator color="#052e16" />
            ) : (
              <Text style={styles.submitText}>Tạo tài khoản</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>đã có tài khoản?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Go to login */}
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/login')}
            disabled={busy}>
            <Text style={styles.secondaryText}>Đăng nhập</Text>
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
    marginBottom: 28,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#166534',
  },
  appName: {
    fontSize: 23,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: '#0d1b2e',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },

  /* Field */
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 7,
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
    borderColor: '#34d399',
    backgroundColor: '#0a1e14',
  },
  inputRowError: {
    borderColor: '#f87171',
    backgroundColor: '#1a0a0a',
  },
  inputRowSuccess: {
    borderColor: '#34d399',
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

  /* Hint messages */
  errorHint: {
    marginTop: 5,
    fontSize: 12,
    color: '#f87171',
    paddingLeft: 2,
  },
  successHint: {
    marginTop: 5,
    fontSize: 12,
    color: '#34d399',
    paddingLeft: 2,
  },

  /* Submit */
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#34d399',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPressed: { opacity: 0.88 },
  submitDisabled: { opacity: 0.55 },
  submitText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
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
    color: '#34d399',
    fontSize: 15,
    fontWeight: '600',
  },
});
