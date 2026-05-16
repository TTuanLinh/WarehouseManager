import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as inventoryApi from '@/src/services/inventoryService';
import * as transactionApi from '@/src/services/transactionService';
import * as warehouseApi from '@/src/services/warehouseService';
import type { StockLevel, StockTransaction, Warehouse } from '@/src/types/models';

function formatTxType(type: string) {
  const m: Record<string, string> = { IMPORT: 'Nhập kho', EXPORT: 'Xuất kho', TRANSFER: 'Chuyển kho' };
  return m[type] ?? type;
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lowStock, setLowStock] = useState<StockLevel[]>([]);
  const [recent, setRecent] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg = dark ? '#080f1c' : '#f8fafc';
  const surface = dark ? '#0d1b2e' : '#ffffff';
  const border = dark ? '#1e3a5f' : '#e2e8f0';

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

  useFocusEffect(useCallback(() => {
    if (!session) { setWarehouses([]); setLowStock([]); setRecent([]); setLoading(false); return () => {}; }
    let alive = true;
    setLoading(true);
    load().catch(() => {}).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [load, session]));

  const onRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load, session]);

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <MaterialIcons name="lock-outline" size={48} color={dark ? '#1e3a5f' : '#cbd5e1'} style={{ marginBottom: 12 }} />
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint, { color: theme.icon }]}>Mở tab Cá nhân để đăng nhập.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}>

      {/* Greeting */}
      <Text style={[styles.greeting, { color: theme.text }]}>Xin chào, {session.username} 👋</Text>

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 32 }} />
      ) : (
        <>
          {/* Stat cards */}
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: dark ? '#0f2040' : '#eff6ff', borderColor: dark ? '#1e3a5f' : '#bfdbfe' }]}>
              <MaterialIcons name="store" size={22} color="#38bdf8" style={{ marginBottom: 6 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{warehouses.length}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>Kho của bạn</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: dark ? '#2d1600' : '#fff7ed', borderColor: dark ? '#7c2d12' : '#fed7aa' }]}>
              <MaterialIcons name="warning-amber" size={22} color="#fbbf24" style={{ marginBottom: 6 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{lowStock.length}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>Sắp hết (≤10)</Text>
            </View>
          </View>

          {/* Low stock */}
          <Text style={[styles.section, { color: theme.text }]}>Hàng cần chú ý</Text>
          {lowStock.length === 0 ? (
            <Text style={[styles.empty, { color: theme.icon }]}>Không có sản phẩm dưới ngưỡng tồn.</Text>
          ) : (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              {lowStock.slice(0, 6).map((row, i) => (
                <View key={`${row.warehouseId}-${row.productId}`}
                  style={[styles.listRow, i < Math.min(lowStock.length, 6) - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.text }]}>{row.productName}</Text>
                    <Text style={[styles.listMeta, { color: theme.icon }]}>{row.warehouseName}</Text>
                  </View>
                  <View style={[styles.qtyBadge, { backgroundColor: dark ? '#2d1600' : '#fff7ed' }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fbbf24' }}>{row.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent transactions */}
          <Text style={[styles.section, { color: theme.text, marginTop: 20 }]}>Hoạt động gần đây</Text>
          {recent.length === 0 ? (
            <Text style={[styles.empty, { color: theme.icon }]}>Chưa có giao dịch.</Text>
          ) : (
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              {recent.map((tx, i) => (
                <View key={tx.id} style={[styles.listRow, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
                  <MaterialIcons
                    name={tx.type === 'IMPORT' ? 'move-to-inbox' : tx.type === 'EXPORT' ? 'outbox' : 'swap-horiz'}
                    size={18} color={tx.type === 'IMPORT' ? '#34d399' : tx.type === 'EXPORT' ? '#f87171' : '#fbbf24'}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.text }]}>{formatTxType(tx.type)} · {tx.product?.name ?? 'Sản phẩm'}</Text>
                    <Text style={[styles.listMeta, { color: theme.icon }]}>SL {tx.quantity} · {formatDate(tx.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  guestHint: { fontSize: 14, textAlign: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: 0.2 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'flex-start' },
  statValue: { fontSize: 30, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 15, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2 },
  empty: { fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  listTitle: { fontSize: 14, fontWeight: '600' },
  listMeta: { fontSize: 12, marginTop: 2 },
  qtyBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
});
