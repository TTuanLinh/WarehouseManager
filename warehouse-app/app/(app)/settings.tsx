import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiBaseUrl } from '@/src/services/api';
import * as warehouseApi from '@/src/services/warehouseService';
import type { Warehouse } from '@/src/types/models';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => makeStyles(dark), [dark]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [addressMap, setAddressMap] = useState<Record<number, string>>({});
  const [phoneMap, setPhoneMap] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const { data } = await warehouseApi.getWarehouses();
    const list = data ?? [];
    setWarehouses(list);
    const nextAddress: Record<number, string> = {};
    const nextPhone: Record<number, string> = {};
    for (const w of list) {
      nextAddress[w.id] = w.address ?? '';
      nextPhone[w.id] = w.phone ?? '';
    }
    setAddressMap(nextAddress);
    setPhoneMap(nextPhone);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveContact = async (id: number) => {
    setSavingId(id);
    try {
      await warehouseApi.updateWarehouseContact(id, addressMap[id] ?? '', phoneMap[id] ?? '');
      await load();
    } finally {
      setSavingId(null);
    }
  };

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

      <Text style={[styles.label, { color: theme.icon, marginTop: 24 }]}>Thông tin nhận hàng theo kho</Text>
      <FlatList
        data={warehouses}
        keyExtractor={(w) => String(w.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
              value={addressMap[item.id] ?? ''}
              onChangeText={(v) => setAddressMap((prev) => ({ ...prev, [item.id]: v }))}
              placeholder="Địa chỉ nhận hàng"
              placeholderTextColor={theme.icon}
            />
            <TextInput
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
              value={phoneMap[item.id] ?? ''}
              onChangeText={(v) => setPhoneMap((prev) => ({ ...prev, [item.id]: v }))}
              placeholder="Số điện thoại nhận"
              placeholderTextColor={theme.icon}
              keyboardType="phone-pad"
            />
            <Pressable
              style={[styles.saveBtn, { backgroundColor: theme.tint }]}
              disabled={savingId === item.id}
              onPress={() => void saveContact(item.id)}>
              <Text style={styles.saveText}>{savingId === item.id ? 'Đang lưu...' : 'Lưu thông tin kho'}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(dark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, padding: 20 },
    label: { fontSize: 13, marginBottom: 6 },
    value: { fontSize: 15, lineHeight: 22 },
    note: { fontSize: 13, lineHeight: 20, marginTop: 10 },
    card: {
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 9,
      marginBottom: 8,
      fontSize: 14,
    },
    saveBtn: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
    saveText: { color: '#fff', fontWeight: '700' },
  });
}
