import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as warehouseApi from '@/src/services/warehouseService';
import type { Warehouse } from '@/src/types/models';

export default function WarehousesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data } = await warehouseApi.getWarehouses();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (session == null) {
        setItems([]);
        setLoading(false);
        return () => {};
      }
      void session.userId;
      let alive = true;
      setLoading(true);
      load()
        .catch(() => setItems([]))
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [load, session])
  );

  const onRefresh = useCallback(async () => {
    if (session == null) return;
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, session]);

  const styles = makeStyles(theme, colorScheme === 'dark');

  const submitCreateWarehouse = useCallback(async () => {
    const name = newWarehouseName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await warehouseApi.createWarehouse(name);
      setCreateOpen(false);
      setNewWarehouseName('');
      await load();
    } finally {
      setCreating(false);
    }
  }, [load, newWarehouseName]);

  if (session == null) {
    return (
      <View style={[styles.center, styles.guestPad]}>
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint, { color: theme.icon }]}>
          Mở tab Cá nhân để đăng nhập và xem danh sách kho.
        </Text>
      </View>
    );
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(w) => String(w.id)}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 88, 100) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có kho nào.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => router.push(`/(app)/warehouses/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />

      {!createOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm kho mới"
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.tint,
              bottom: Math.max(insets.bottom, 12) + 16,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => setCreateOpen(true)}>
          <MaterialIcons name="add-business" size={26} color="#fff" />
        </Pressable>
      ) : null}

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !creating && setCreateOpen(false)}>
        <View style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => !creating && setCreateOpen(false)} />
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Tạo kho mới</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={newWarehouseName}
              onChangeText={setNewWarehouseName}
              placeholder="Nhập tên kho..."
              placeholderTextColor={theme.icon}
              editable={!creating}
            />
            <View style={styles.actions}>
              <Pressable onPress={() => !creating && setCreateOpen(false)}>
                <Text style={{ color: theme.text }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.okBtn, { backgroundColor: theme.tint }]}
                onPress={() => void submitCreateWarehouse()}
                disabled={creating || newWarehouseName.trim().length === 0}>
                <Text style={styles.okText}>{creating ? '...' : 'Tạo kho'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(theme: (typeof Colors)['light'], dark: boolean) {
  return StyleSheet.create({
    screen: { flex: 1 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    list: {
      padding: 16,
      backgroundColor: theme.background,
      flexGrow: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    chevron: {
      fontSize: 22,
      color: theme.icon,
    },
    pressed: { opacity: 0.85 },
    empty: {
      textAlign: 'center',
      marginTop: 48,
      color: theme.icon,
      fontSize: 15,
    },
    guestPad: { paddingHorizontal: 24 },
    guestTitle: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
    },
    guestHint: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 4,
    },
    modalWrap: { flex: 1, justifyContent: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    card: {
      marginHorizontal: 24,
      borderRadius: 16,
      padding: 18,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 14,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
    okBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    okText: { color: '#fff', fontWeight: '700' },
  });
}
