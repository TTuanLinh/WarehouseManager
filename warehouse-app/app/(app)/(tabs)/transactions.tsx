import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as transactionApi from '@/src/services/transactionService';
import type { StockTransaction } from '@/src/types/models';

function formatTxType(type: string) {
  switch (type) {
    case 'IMPORT':
      return 'Nhập kho';
    case 'EXPORT':
      return 'Xuất kho';
    case 'TRANSFER':
      return 'Chuyển kho';
    case 'ADJUSTMENT':
      return 'Kiểm kê / điều chỉnh';
    case 'REMOVAL':
      return 'Gỡ khỏi kho';
    default:
      return type;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function TransactionsScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [items, setItems] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await transactionApi.getTransactions({ page: 0, size: 50 });
    setItems(data.content ?? []);
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
          Mở tab Cá nhân để đăng nhập và xem giao dịch.
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
      keyExtractor={(tx) => String(tx.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có giao dịch.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title}>
            {formatTxType(item.type)} · {item.product?.name ?? '—'}
          </Text>
          <Text style={styles.meta}>Số lượng: {item.quantity}</Text>
          <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
        </View>
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
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    meta: {
      fontSize: 13,
      color: theme.icon,
      marginTop: 4,
    },
    empty: {
      textAlign: 'center',
      marginTop: 48,
      color: theme.icon,
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
