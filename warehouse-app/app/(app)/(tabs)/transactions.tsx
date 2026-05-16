import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as transactionApi from '@/src/services/transactionService';
import type { DailyStats, MonthlyStatsResponse } from '@/src/services/transactionService';
import * as warehouseApi from '@/src/services/warehouseService';
import type { StockTransaction, Warehouse } from '@/src/types/models';

// ─── helpers ─────────────────────────────────────────────────────────────────

type TxType = 'ALL' | 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'ADJUSTMENT' | 'REMOVAL';
type MainTab = 'list' | 'stats';

const FILTER_OPTIONS: { key: TxType; label: string }[] = [
  { key: 'ALL',        label: 'Tất cả'   },
  { key: 'IMPORT',     label: 'Nhập kho' },
  { key: 'EXPORT',     label: 'Xuất kho' },
  { key: 'TRANSFER',   label: 'Chuyển'   },
  { key: 'ADJUSTMENT', label: 'Kiểm kê'  },
  { key: 'REMOVAL',    label: 'Gỡ kho'   },
];

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

function txLabel(type: string) {
  const m: Record<string, string> = {
    IMPORT: 'Nhập kho', EXPORT: 'Xuất kho', TRANSFER: 'Chuyển kho',
    ADJUSTMENT: 'Kiểm kê / Điều chỉnh', REMOVAL: 'Gỡ khỏi kho',
  };
  return m[type] ?? type;
}
function txIcon(type: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (type === 'IMPORT')     return 'move-to-inbox';
  if (type === 'EXPORT')     return 'outbox';
  if (type === 'TRANSFER')   return 'swap-horiz';
  if (type === 'ADJUSTMENT') return 'tune';
  return 'remove-circle-outline';
}
function txColor(type: string) {
  if (type === 'IMPORT')     return '#34d399';
  if (type === 'EXPORT')     return '#f87171';
  if (type === 'TRANSFER')   return '#fbbf24';
  if (type === 'ADJUSTMENT') return '#a78bfa';
  return '#94a3b8';
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

// ─── Bar chart component ─────────────────────────────────────────────────────

const BAR_W = 12;
const BAR_GAP = 5;
const GROUP_GAP = 10;
const CHART_H = 180;
const LABEL_H = 28;

type BarChartProps = {
  days: DailyStats[];
  dark: boolean;
};

function BarChart({ days, dark }: BarChartProps) {
  if (days.length === 0) return null;

  const maxVal = Math.max(...days.flatMap(d => [d.importQty, d.exportQty, d.transferIn, d.transferOut]), 1);
  const groupW = BAR_W * 4 + BAR_GAP * 3 + GROUP_GAP;
  const totalW = Math.max(days.length * groupW + GROUP_GAP, 300);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
      <Svg width={totalW} height={CHART_H + LABEL_H}>
        {days.map((d, i) => {
          const x = GROUP_GAP / 2 + i * groupW;
          const bars = [
            { qty: d.importQty,   color: '#34d399' },
            { qty: d.exportQty,   color: '#f87171' },
            { qty: d.transferIn,  color: '#38bdf8' },
            { qty: d.transferOut, color: '#fbbf24' },
          ];
          return bars.map((b, j) => {
            const barH = Math.round((b.qty / maxVal) * (CHART_H - 20));
            const bx = x + j * (BAR_W + BAR_GAP);
            return (
              <Rect
                key={`${i}-${j}`}
                x={bx} y={CHART_H - barH - 4}
                width={BAR_W} height={barH || 1}
                rx={3} fill={b.color} opacity={barH ? 0.85 : 0.15}
              />
            );
          }).concat([
            <SvgText
              key={`lbl-${i}`}
              x={x + groupW / 2 - GROUP_GAP / 2}
              y={CHART_H + 18}
              fontSize={9}
              fill={dark ? '#64748b' : '#94a3b8'}
              textAnchor="middle"
            >
              {`N${d.day}`}
            </SvgText>,
          ]);
        })}
      </Svg>
    </ScrollView>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const bg      = dark ? '#080f1c' : '#f8fafc';
  const surface = dark ? '#0d1b2e' : '#ffffff';
  const border  = dark ? '#1e3a5f' : '#e2e8f0';

  // ── List state
  const [items,        setItems]        = useState<StockTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [warehouseMap, setWarehouseMap] = useState<Record<number, string>>({});
  const [activeFilter, setActiveFilter] = useState<TxType>('ALL');
  const [mainTab,      setMainTab]      = useState<MainTab>('list');

  // ── Stats state
  const [warehouses,    setWarehouses]    = useState<Warehouse[]>([]);
  const [statsWh,       setStatsWh]       = useState<number | null>(null);
  const now = new Date();
  const [statsYear,     setStatsYear]     = useState(now.getFullYear());
  const [statsMonth,    setStatsMonth]    = useState(now.getMonth() + 1);
  const [statsData,     setStatsData]     = useState<MonthlyStatsResponse | null>(null);
  const [statsLoading,  setStatsLoading]  = useState(false);
  const [statsError,    setStatsError]    = useState<string | null>(null);

  // ── Load list + warehouses
  const load = useCallback(async () => {
    const [txRes, whRes] = await Promise.all([
      transactionApi.getTransactions({ page: 0, size: 200 }),
      warehouseApi.getWarehouses(),
    ]);
    const map: Record<number, string> = {};
    const whs: Warehouse[] = whRes.data ?? [];
    whs.forEach((w) => { map[w.id] = w.name; });
    setWarehouseMap(map);
    setWarehouses(whs);
    if (statsWh === null && whs.length > 0) setStatsWh(whs[0].id);
    setItems(txRes.data.content ?? []);
  }, [statsWh]);

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

  // ── Load stats
  const loadStats = useCallback(async () => {
    if (!statsWh) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const { data } = await transactionApi.getMonthlyStats(statsWh, statsYear, statsMonth);
      setStatsData(data);
    } catch (e) {
      setStatsError(getAxiosErrorMessage(e, 'Không tải được thống kê.'));
      setStatsData(null);
    } finally { setStatsLoading(false); }
  }, [statsWh, statsYear, statsMonth]);

  // Client-side filter
  const filtered = useMemo(
    () => activeFilter === 'ALL' ? items : items.filter(t => t.type === activeFilter),
    [items, activeFilter],
  );

  // Totals for stats summary
  const totals = useMemo(() => {
    if (!statsData) return null;
    return statsData.days.reduce(
      (acc, d) => ({
        importQty:   acc.importQty   + d.importQty,
        exportQty:   acc.exportQty   + d.exportQty,
        transferIn:  acc.transferIn  + d.transferIn,
        transferOut: acc.transferOut + d.transferOut,
      }),
      { importQty: 0, exportQty: 0, transferIn: 0, transferOut: 0 },
    );
  }, [statsData]);

  // ── unauthenticated ───────────────────────────────────────────────────────
  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <MaterialIcons name="lock-outline" size={48} color={dark ? '#1e3a5f' : '#cbd5e1'} style={{ marginBottom: 12 }} />
        <Text style={[styles.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[styles.guestHint,  { color: theme.icon  }]}>Mở tab Cá nhân để đăng nhập.</Text>
      </View>
    );
  }

  if (loading && items.length === 0) {
    return <View style={[styles.center, { backgroundColor: bg }]}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Main tab bar ── */}
      <View style={[styles.mainTabBar, { backgroundColor: dark ? '#0a1525' : '#f1f5f9', borderBottomColor: border }]}>
        {(['list', 'stats'] as MainTab[]).map(t => (
          <Pressable key={t} style={[styles.mainTabBtn, mainTab === t && styles.mainTabBtnActive]} onPress={() => setMainTab(t)}>
            <MaterialIcons
              name={t === 'list' ? 'receipt-long' : 'bar-chart'}
              size={15} color={mainTab === t ? '#38bdf8' : '#64748b'} style={{ marginRight: 5 }}
            />
            <Text style={[styles.mainTabText, mainTab === t && styles.mainTabTextActive]}>
              {t === 'list' ? 'Danh sách' : 'Thống kê'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ════════════════ LIST TAB ════════════════ */}
      {mainTab === 'list' && (
        <>
          {/* Filter chips */}
          <View style={[styles.filterWrap, { backgroundColor: dark ? '#0a1525' : '#f1f5f9', borderBottomColor: border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {FILTER_OPTIONS.map(opt => {
                const active = activeFilter === opt.key;
                const color  = opt.key === 'ALL' ? '#38bdf8' : txColor(opt.key);
                return (
                  <Pressable
                    key={opt.key}
                    style={[styles.filterChip, {
                      backgroundColor: active ? (dark ? `${color}22` : `${color}18`) : (dark ? '#0d1b2e' : '#ffffff'),
                      borderColor: active ? color : border,
                    }]}
                    onPress={() => setActiveFilter(opt.key)}>
                    {opt.key !== 'ALL' && <View style={[styles.chipDot, { backgroundColor: color }]} />}
                    <Text style={[styles.chipText, { color: active ? color : theme.icon }]}>{opt.label}</Text>
                    {active && opt.key !== 'ALL' && (
                      <View style={[styles.chipCountBadge, { backgroundColor: color }]}>
                        <Text style={styles.chipCountText}>{filtered.length}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(tx) => String(tx.id)}
            contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialIcons name="receipt-long" size={44} color={dark ? '#1e3a5f' : '#cbd5e1'} />
                <Text style={[styles.guestHint, { color: theme.icon, marginTop: 10 }]}>
                  {items.length === 0 ? 'Chưa có giao dịch nào.' : `Không có giao dịch loại "${FILTER_OPTIONS.find(o => o.key === activeFilter)?.label}".`}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const color = txColor(item.type);
              const transferInfo = item.type === 'TRANSFER'
                ? `${item.fromWarehouseId ? (warehouseMap[item.fromWarehouseId] ?? `#${item.fromWarehouseId}`) : '—'} ➜ ${item.toWarehouseId ? (warehouseMap[item.toWarehouseId] ?? `#${item.toWarehouseId}`) : '—'}`
                : null;
              return (
                <View style={[styles.row, { backgroundColor: surface, borderColor: border }]}>
                  <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                    <MaterialIcons name={txIcon(item.type)} size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.title, { color: theme.text }]}>{txLabel(item.type)}</Text>
                      <View style={[styles.qtyBadge, { backgroundColor: `${color}18` }]}>
                        <Text style={[styles.qty, { color }]}>×{item.quantity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.meta, { color: theme.icon }]}>{item.product?.name ?? '—'}</Text>
                    {transferInfo && <Text style={[styles.meta, { color: theme.icon }]}>{transferInfo}</Text>}
                    <Text style={[styles.date, { color: dark ? '#334155' : '#94a3b8' }]}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {/* ════════════════ STATS TAB ════════════════ */}
      {mainTab === 'stats' && (
        <ScrollView contentContainerStyle={styles.statsPad} showsVerticalScrollIndicator={false}>

          {/* Controls */}
          <View style={[styles.controlCard, { backgroundColor: surface, borderColor: border }]}>
            {/* Warehouse picker */}
            <Text style={[styles.controlLabel, { color: theme.icon }]}>Kho</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {warehouses.map(w => {
                const sel = statsWh === w.id;
                return (
                  <Pressable key={w.id}
                    style={[styles.pickChip, { borderColor: sel ? '#38bdf8' : border, backgroundColor: sel ? (dark ? '#0f2040' : '#eff6ff') : (dark ? '#0a1525' : '#f8fafc') }]}
                    onPress={() => setStatsWh(w.id)}>
                    <Text style={[styles.pickChipText, { color: sel ? '#38bdf8' : theme.icon }]}>{w.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Month picker */}
            <Text style={[styles.controlLabel, { color: theme.icon, marginTop: 12 }]}>Tháng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {MONTHS.map((label, idx) => {
                const m = idx + 1;
                const sel = statsMonth === m;
                return (
                  <Pressable key={m}
                    style={[styles.pickChip, { borderColor: sel ? '#a78bfa' : border, backgroundColor: sel ? (dark ? '#1e1040' : '#f5f3ff') : (dark ? '#0a1525' : '#f8fafc') }]}
                    onPress={() => setStatsMonth(m)}>
                    <Text style={[styles.pickChipText, { color: sel ? '#a78bfa' : theme.icon }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Year picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <Text style={[styles.controlLabel, { color: theme.icon, marginTop: 0 }]}>Năm</Text>
              <Pressable onPress={() => setStatsYear(y => y - 1)} style={styles.yearBtn}>
                <MaterialIcons name="chevron-left" size={20} color="#38bdf8" />
              </Pressable>
              <Text style={[styles.yearText, { color: theme.text }]}>{statsYear}</Text>
              <Pressable onPress={() => setStatsYear(y => y + 1)} style={styles.yearBtn}>
                <MaterialIcons name="chevron-right" size={20} color="#38bdf8" />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.loadBtn, { opacity: (!statsWh || statsLoading || pressed) ? 0.7 : 1 }]}
              disabled={!statsWh || statsLoading}
              onPress={() => void loadStats()}>
              {statsLoading
                ? <ActivityIndicator color="#0b1a2b" size="small" />
                : <><MaterialIcons name="bar-chart" size={16} color="#0b1a2b" style={{ marginRight: 6 }} /><Text style={styles.loadBtnText}>Xem thống kê</Text></>
              }
            </Pressable>
          </View>

          {/* Error */}
          {statsError && (
            <View style={[styles.errBox, { borderColor: '#7c2d12', backgroundColor: '#422006' }]}>
              <Text style={{ color: '#fbbf24', fontSize: 13 }}>{statsError}</Text>
            </View>
          )}

          {/* Chart */}
          {statsData && (
            <View style={[styles.chartCard, { backgroundColor: surface, borderColor: border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                {statsData.warehouseName} — {MONTHS[statsData.month - 1]}/{statsData.year}
              </Text>

              {statsData.days.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="bar-chart" size={36} color={dark ? '#1e3a5f' : '#cbd5e1'} />
                  <Text style={[styles.guestHint, { color: theme.icon, marginTop: 8 }]}>Không có giao dịch trong tháng này.</Text>
                </View>
              ) : (
                <>
                  {/* Legend */}
                  <View style={styles.legend}>
                    {[['#34d399','Nhập'],['#f87171','Xuất'],['#38bdf8','Chuyển vào'],['#fbbf24','Chuyển ra']].map(([c, l]) => (
                      <View key={l} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: c }]} />
                        <Text style={[styles.legendText, { color: theme.icon }]}>{l}</Text>
                      </View>
                    ))}
                  </View>

                  <BarChart days={statsData.days} dark={dark} />

                  {/* Summary totals */}
                  <View style={styles.summaryRow}>
                    {[
                      { label: 'Nhập',       val: totals?.importQty,   color: '#34d399' },
                      { label: 'Xuất',       val: totals?.exportQty,   color: '#f87171' },
                      { label: 'Vào',        val: totals?.transferIn,  color: '#38bdf8' },
                      { label: 'Ra',         val: totals?.transferOut, color: '#fbbf24' },
                    ].map(s => (
                      <View key={s.label} style={[styles.summaryCard, { backgroundColor: dark ? `${s.color}12` : `${s.color}10`, borderColor: `${s.color}40` }]}>
                        <Text style={[styles.summaryVal, { color: s.color }]}>{s.val ?? 0}</Text>
                        <Text style={[styles.summaryLabel, { color: theme.icon }]}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  guestHint:  { fontSize: 14, textAlign: 'center' },
  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },

  // Main tabs
  mainTabBar:      { flexDirection: 'row', borderBottomWidth: 1 },
  mainTabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  mainTabBtnActive:{ borderBottomWidth: 2, borderBottomColor: '#38bdf8' },
  mainTabText:     { fontSize: 13, fontWeight: '600', color: '#64748b' },
  mainTabTextActive:{ color: '#38bdf8' },

  // Filter chips
  filterWrap:   { borderBottomWidth: 1, paddingVertical: 10 },
  filterScroll: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 5 },
  chipDot:      { width: 7, height: 7, borderRadius: 4 },
  chipText:     { fontSize: 13, fontWeight: '600' },
  chipCountBadge: { borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chipCountText:  { fontSize: 10, fontWeight: '800', color: '#0b1a2b' },

  // List
  list:     { padding: 16, paddingBottom: 32 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 14, fontWeight: '700' },
  qtyBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  qty:      { fontSize: 13, fontWeight: '800' },
  meta:     { fontSize: 12, marginTop: 2 },
  date:     { fontSize: 11, marginTop: 4 },

  // Stats
  statsPad:     { padding: 16, paddingBottom: 40 },
  controlCard:  { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 14 },
  controlLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  pickChip:     { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pickChipText: { fontSize: 13, fontWeight: '600' },
  yearBtn:      { padding: 4 },
  yearText:     { fontSize: 16, fontWeight: '700', minWidth: 48, textAlign: 'center' },
  loadBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38bdf8', borderRadius: 14, paddingVertical: 12, marginTop: 16 },
  loadBtnText:  { color: '#0b1a2b', fontWeight: '700', fontSize: 14 },
  errBox:       { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  chartCard:    { borderRadius: 18, padding: 16, borderWidth: 1 },
  chartTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:    { width: 9, height: 9, borderRadius: 5 },
  legendText:   { fontSize: 12 },
  summaryRow:   { flexDirection: 'row', gap: 8, marginTop: 14 },
  summaryCard:  { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1, alignItems: 'center' },
  summaryVal:   { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
});
