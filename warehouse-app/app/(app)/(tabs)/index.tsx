import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as inventoryApi from '@/src/services/inventoryService';
import * as transactionApi from '@/src/services/transactionService';
import * as warehouseApi from '@/src/services/warehouseService';
import type { StockLevel, StockTransaction, Warehouse } from '@/src/types/models';

function formatTxType(type: string) {
  switch (type) {
    case 'IMPORT':
      return 'Nhập kho';
    case 'EXPORT':
      return 'Xuất kho';
    case 'TRANSFER':
      return 'Chuyển kho';
    default:
      return type;
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lowStock, setLowStock] = useState<StockLevel[]>([]);
  const [recent, setRecent] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [whRes, lowRes, txRes] = await Promise.all([
      warehouseApi.getWarehouses(),
      inventoryApi.getLowStock(10),
      transactionApi.getTransactions({ page: 0, size: 8 }),
    ]);
    setWarehouses(whRes.data);
    setLowStock(lowRes.data);
    setRecent(txRes.data.content ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (session == null) {
        setWarehouses([]);
        setLowStock([]);
        setRecent([]);
        setLoading(false);
        return () => {};
      }
      void session.userId;
      let alive = true;
      setLoading(true);
      load()
        .catch(() => {
          /* errors surfaced via empty state */
        })
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
      <View style={[styles.scroll, styles.guestWrap]}>
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint, { color: theme.icon }]}>
          Mở tab Cá nhân và chọn Đăng nhập hoặc Đăng ký để xem tổng quan.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Xin chào, {session?.username ?? 'bạn'} 👋</Text>
      <Text style={styles.sectionTitle}>Tổng quan</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.tint} />
      ) : (
        <>
          <View style={styles.cardRow}>
            <View style={[styles.statCard, styles.statPrimary]}>
              <Text style={styles.statValue}>{warehouses.length}</Text>
              <Text style={styles.statLabel}>Kho của bạn</Text>
            </View>
            <View style={[styles.statCard, styles.statWarn]}>
              <Text style={styles.statValue}>{lowStock.length}</Text>
              <Text style={styles.statLabel}>Sắp hết (≤10)</Text>
            </View>
          </View>

          <Text style={styles.subheading}>Hàng cần chú ý</Text>
          {lowStock.length === 0 ? (
            <Text style={styles.muted}>Không có sản phẩm nào dưới ngưỡng tồn.</Text>
          ) : (
            lowStock.slice(0, 6).map((row) => (
              <View key={`${row.warehouseId}-${row.productId}`} style={styles.listRow}>
                <Text style={styles.listTitle}>{row.productName}</Text>
                <Text style={styles.listMeta}>
                  {row.warehouseName} · còn {row.quantity}
                </Text>
              </View>
            ))
          )}
        </>
      )}

      <Text style={[styles.sectionTitle, styles.mt]}>Hoạt động gần đây</Text>
      {recent.length === 0 ? (
        <Text style={styles.muted}>Chưa có giao dịch.</Text>
      ) : (
        recent.map((tx) => (
          <View key={tx.id} style={styles.listRow}>
            <Text style={styles.listTitle}>
              {formatTxType(tx.type)} · {tx.product?.name ?? 'Sản phẩm'}
            </Text>
            <Text style={styles.listMeta}>
              SL {tx.quantity} · {formatDate(tx.createdAt)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function makeStyles(theme: (typeof Colors)['light'], dark: boolean) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    greeting: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    subheading: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginTop: 8,
      marginBottom: 8,
    },
    mt: { marginTop: 24 },
    loader: { marginVertical: 24 },
    cardRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
    },
    statPrimary: {
      backgroundColor: dark ? '#1e3a5f' : '#e0f2fe',
    },
    statWarn: {
      backgroundColor: dark ? '#422006' : '#ffedd5',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 13,
      color: theme.icon,
      marginTop: 4,
    },
    listRow: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? '#334155' : '#e2e8f0',
    },
    listTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
    },
    listMeta: {
      fontSize: 13,
      color: theme.icon,
      marginTop: 2,
    },
    muted: {
      fontSize: 14,
      color: theme.icon,
      fontStyle: 'italic',
    },
    guestWrap: {
      justifyContent: 'center',
      padding: 24,
    },
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
