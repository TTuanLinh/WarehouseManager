import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  RefreshControl, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as warehouseApi from '@/src/services/warehouseService';
import type { Warehouse } from '@/src/types/models';

export default function WarehousesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bg = dark ? '#080f1c' : '#f8fafc';
  const surface = dark ? '#0d1b2e' : '#ffffff';
  const border = dark ? '#1e3a5f' : '#e2e8f0';

  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [focused, setFocused] = useState(false);

  const load = useCallback(async () => {
    const { data } = await warehouseApi.getWarehouses();
    setItems(data);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!session) { setItems([]); setLoading(false); return () => {}; }
    let alive = true;
    setLoading(true);
    load().catch(() => setItems([])).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load, session]));

  const onRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load, session]);

  const submitCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await warehouseApi.createWarehouse(name);
      setCreateOpen(false);
      setNewName('');
      await load();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không tạo được kho.'));
    } finally { setCreating(false); }
  }, [load, newName]);

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <MaterialIcons name="lock-outline" size={48} color={dark ? '#1e3a5f' : '#cbd5e1'} style={{ marginBottom: 12 }} />
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint, { color: theme.icon }]}>Mở tab Cá nhân để đăng nhập.</Text>
      </View>
    );
  }

  if (loading && items.length === 0) {
    return <View style={[styles.center, { backgroundColor: bg }]}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <FlatList
        data={items}
        keyExtractor={(w) => String(w.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 88, 100) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="store" size={44} color={dark ? '#1e3a5f' : '#cbd5e1'} />
            <Text style={[styles.guestHint, { color: theme.icon, marginTop: 10 }]}>Chưa có kho nào. Nhấn + để tạo.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: surface, borderColor: border }, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/(app)/warehouses/${item.id}`)}>
            <View style={styles.rowIcon}>
              <MaterialIcons name="store" size={20} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, { color: theme.text }]}>{item.name}</Text>
              {item.address ? <Text style={[styles.rowMeta, { color: theme.icon }]}>{item.address}</Text> : null}
            </View>
            <MaterialIcons name="chevron-right" size={22} color={dark ? '#334155' : '#cbd5e1'} />
          </Pressable>
        )}
      />

      {!createOpen && (
        <Pressable
          accessibilityRole="button" accessibilityLabel="Thêm kho mới"
          style={({ pressed }) => [{
            position: 'absolute', right: 20, bottom: Math.max(insets.bottom, 12) + 16,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: '#38bdf8', alignItems: 'center', justifyContent: 'center',
            elevation: 8, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4, shadowRadius: 8, opacity: pressed ? 0.88 : 1,
          }]}
          onPress={() => setCreateOpen(true)}>
          <MaterialIcons name="add-business" size={26} color="#0b1a2b" />
        </Pressable>
      )}

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => !creating && setCreateOpen(false)}>
        <View style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => !creating && setCreateOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Tạo kho mới</Text>
            <Text style={[styles.modalSub, { color: theme.icon }]}>Nhập tên kho để bắt đầu quản lý hàng hóa.</Text>
            <View style={[styles.inputRow, focused && styles.inputFocused, { borderColor: focused ? '#38bdf8' : border, backgroundColor: dark ? '#0a1525' : '#f8fafc' }]}>
              <MaterialIcons name="store" size={18} color={focused ? '#38bdf8' : theme.icon} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={newName} onChangeText={setNewName}
                placeholder="Tên kho..." placeholderTextColor={theme.icon}
                editable={!creating}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => !creating && setCreateOpen(false)}>
                <Text style={{ color: theme.icon, fontWeight: '600' }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, (!newName.trim() || creating) && { opacity: 0.5 }]}
                onPress={() => void submitCreate()}
                disabled={!newName.trim() || creating}>
                <Text style={styles.confirmText}>{creating ? '…' : 'Tạo kho'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  guestHint: { fontSize: 14, textAlign: 'center' },
  list: { padding: 16 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#0f2040', alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  modalWrap: { flex: 1, justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { margin: 24, borderRadius: 20, padding: 22, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 50, marginBottom: 18 },
  inputFocused: {},
  input: { flex: 1, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  confirmBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  confirmText: { color: '#0b1a2b', fontWeight: '700', fontSize: 15 },
});
