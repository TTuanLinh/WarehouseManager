import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <FlatList
      data={items}
      keyExtractor={(w) => String(w.id)}
      contentContainerStyle={styles.list}
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
  );
}

function makeStyles(theme: (typeof Colors)['light'], dark: boolean) {
  return StyleSheet.create({
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
  });
}
