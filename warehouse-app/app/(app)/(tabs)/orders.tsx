import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as marketplaceApi from '@/src/services/marketplaceService';
import * as orderApi from '@/src/services/orderService';
import * as userApi from '@/src/services/userService';
import * as warehouseApi from '@/src/services/warehouseService';
import type { MarketplaceListing, Order, UserBrief, Warehouse } from '@/src/types/models';

type CartLine = MarketplaceListing & { quantity: number };
type RoleTab = 'buyer' | 'seller';
type MainTab = 'list' | 'create';


function statusLabel(status: Order['status']) {
  const map: Record<string, string> = {
    PENDING_SELLER_CONFIRM: 'Chờ xác nhận',
    IN_TRANSIT: 'Đang giao',
    AWAITING_PAYMENT: 'Chờ thanh toán',
    COMPLETED: 'Thành công',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
}

function statusColor(status: Order['status']) {
  if (status === 'COMPLETED') return '#34d399';
  if (status === 'REJECTED' || status === 'CANCELLED') return '#f87171';
  if (status === 'AWAITING_PAYMENT') return '#fbbf24';
  return '#38bdf8';
}

export default function OrdersScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const s = useMemo(() => makeStyles(dark), [dark]);

  const [mainTab, setMainTab] = useState<MainTab>('list');
  const [role, setRole] = useState<RoleTab>('buyer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [myWarehouses, setMyWarehouses] = useState<Warehouse[]>([]);

  // Create order state
  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerResults, setSellerResults] = useState<UserBrief[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<UserBrief | null>(null);
  const [listingQuery, setListingQuery] = useState('');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [listingQtyMap, setListingQtyMap] = useState<Record<string, string>>({});
  const [chooseWarehouseOpen, setChooseWarehouseOpen] = useState(false);
  const [selectedDestWarehouseId, setSelectedDestWarehouseId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    if (!session) { setOrders([]); setOrdersLoading(false); return; }
    const [{ data: dataOrders }, { data: whs }] = await Promise.all([
      orderApi.getOrders(role), warehouseApi.getWarehouses(),
    ]);
    setOrders(dataOrders ?? []);
    setMyWarehouses(whs ?? []);
  }, [role, session]);

  useFocusEffect(useCallback(() => {
    setOrdersLoading(true);
    loadOrders().catch(() => setOrders([])).finally(() => setOrdersLoading(false));
  }, [loadOrders]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadOrders(); } finally { setRefreshing(false); }
  }, [loadOrders]);

  const runSearchSeller = async () => {
    if (sellerQuery.trim().length < 2) return;
    try { const { data } = await userApi.searchUsers(sellerQuery.trim()); setSellerResults(data ?? []); }
    catch { setSellerResults([]); }
  };

  const loadListings = async (seller: UserBrief, query?: string) => {
    setListingsLoading(true);
    try { const { data } = await marketplaceApi.getSellerListings(seller.id, query); setListings(data ?? []); }
    catch { setListings([]); }
    finally { setListingsLoading(false); }
  };

  const addToCart = (listing: MarketplaceListing, qtyRaw: string) => {
    const qty = parseInt(qtyRaw.replace(/\s/g, ''), 10);
    if (!Number.isFinite(qty) || qty <= 0 || qty > listing.availableQuantity) return;
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === listing.productId && i.warehouseId === listing.warehouseId);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], quantity: qty }; return next; }
      return [...prev, { ...listing, quantity: qty }];
    });
  };

  const submitOrder = async () => {
    if (!selectedSeller || cart.length === 0 || !selectedDestWarehouseId) return;
    try {
      await orderApi.createOrder({
        sellerId: selectedSeller.id,
        destinationWarehouseId: selectedDestWarehouseId,
        items: cart.map(c => ({ warehouseId: c.warehouseId, productId: c.productId, quantity: c.quantity })),
      });
      setCart([]); setSelectedDestWarehouseId(null); setChooseWarehouseOpen(false);
      setMainTab('list');
      await loadOrders();
    } catch (e) { alert(getAxiosErrorMessage(e, 'Tạo đơn thất bại.')); }
  };

  const runAction = async (fn: () => Promise<void>, orderId: number) => {
    setBusyOrderId(orderId);
    try { await fn(); await loadOrders(); }
    catch (e) { alert(getAxiosErrorMessage(e, 'Thao tác thất bại.')); }
    finally { setBusyOrderId(null); }
  };

  if (!session) {
    return (
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <MaterialIcons name="lock-outline" size={48} color="#1e3a5f" style={{ marginBottom: 12 }} />
        <Text style={[s.guestTitle, { color: theme.text }]}>Chưa đăng nhập</Text>
        <Text style={[s.guestHint, { color: theme.icon }]}>Vào tab Cá nhân để đăng nhập.</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      {/* ── Main top-tab bar ── */}
      <View style={s.mainTabBar}>
        {(['list', 'create'] as MainTab[]).map((t) => (
          <Pressable key={t} style={[s.mainTabBtn, mainTab === t && s.mainTabBtnActive]} onPress={() => setMainTab(t)}>
            <MaterialIcons
              name={t === 'list' ? 'receipt-long' : 'add-shopping-cart'}
              size={16}
              color={mainTab === t ? '#38bdf8' : '#64748b'}
              style={{ marginRight: 5 }}
            />
            <Text style={[s.mainTabText, mainTab === t && s.mainTabTextActive]}>
              {t === 'list' ? 'Danh sách đơn' : 'Tạo đơn mới'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ══════════════ LIST PANEL ══════════════ */}
      {mainTab === 'list' && (
        <View style={{ flex: 1 }}>
          {/* Role toggle */}
          <View style={s.roleBar}>
            {(['buyer', 'seller'] as RoleTab[]).map((r) => (
              <Pressable key={r} style={[s.roleBtn, role === r && s.roleBtnActive]} onPress={() => setRole(r)}>
                <Text style={[s.roleText, role === r && s.roleTextActive]}>
                  {r === 'buyer' ? 'Bên mua' : 'Bên bán'}
                </Text>
              </Pressable>
            ))}
          </View>
          {ordersLoading ? (
            <ActivityIndicator color="#38bdf8" style={{ marginTop: 32 }} />
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(o) => String(o.id)}
              contentContainerStyle={s.listPad}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
              ListEmptyComponent={
                <View style={s.emptyWrap}>
                  <MaterialIcons name="inbox" size={40} color="#1e3a5f" />
                  <Text style={s.emptyText}>Chưa có đơn hàng nào.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={s.orderCard}>
                  <View style={s.orderHeader}>
                    <Text style={s.orderId}>Đơn #{item.id}</Text>
                    <View style={[s.statusBadge, { borderColor: statusColor(item.status) }]}>
                      <Text style={[s.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                    </View>
                  </View>
                  <Text style={s.orderMeta}>👤 Mua: {item.buyerUsername} · Bán: {item.sellerUsername}</Text>
                  <Text style={s.orderMeta}>📦 Kho nhận: {item.destinationWarehouseName || `#${item.destinationWarehouseId}`}</Text>
                  {item.items.map((it) => (
                    <Text key={it.id} style={s.orderItem}>· {it.productName} × {it.quantity}</Text>
                  ))}
                  <Text style={s.orderTotal}>{item.totalAmount.toLocaleString('vi-VN')} đ</Text>

                  {role === 'seller' && item.status === 'PENDING_SELLER_CONFIRM' && (
                    <Pressable style={s.actionBtn} disabled={busyOrderId === item.id}
                      onPress={() => runAction(async () => { await orderApi.sellerConfirmOrder(item.id); }, item.id)}>
                      <Text style={s.actionBtnText}>{busyOrderId === item.id ? '…' : '✓ Xác nhận & gửi hàng'}</Text>
                    </Pressable>
                  )}
                  {role === 'buyer' && item.status === 'IN_TRANSIT' && (
                    <Pressable style={[s.actionBtn, { backgroundColor: '#052e16', borderColor: '#34d399' }]}
                      disabled={busyOrderId === item.id}
                      onPress={() => runAction(async () => { await orderApi.buyerConfirmReceived(item.id); }, item.id)}>
                      <Text style={[s.actionBtnText, { color: '#34d399' }]}>{busyOrderId === item.id ? '…' : '✓ Đã nhận hàng'}</Text>
                    </Pressable>
                  )}
                  {role === 'buyer' && item.status === 'AWAITING_PAYMENT' && (
                    <View style={s.qrBlock}>
                      <Text style={s.qrTitle}>Thanh toán — {item.totalAmount.toLocaleString('vi-VN')} đ</Text>
                      {item.sellerBankQrPayload?.trim() ? (
                        <View style={s.qrWrap}>
                          <QRCode
                            value={item.sellerBankQrPayload.trim()}
                            size={176} color="#0f172a" backgroundColor="#ffffff"
                          />
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#422006', padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#7c2d12' }}>
                          <Text style={{ color: '#fbbf24', fontSize: 13, textAlign: 'center' }}>
                            <MaterialIcons name="warning" size={14} /> Người bán chưa cấu hình mã QR ngân hàng. Vui lòng liên hệ người bán để thanh toán.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  {role === 'seller' && item.status === 'AWAITING_PAYMENT' && (
                    <Pressable style={[s.actionBtn, { backgroundColor: '#052e16', borderColor: '#34d399' }]}
                      disabled={busyOrderId === item.id}
                      onPress={() => runAction(async () => { await orderApi.sellerConfirmPayment(item.id); }, item.id)}>
                      <Text style={[s.actionBtnText, { color: '#34d399' }]}>{busyOrderId === item.id ? '…' : '✓ Đã nhận tiền'}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ══════════════ CREATE PANEL ══════════════ */}
      {mainTab === 'create' && (
        <ScrollView contentContainerStyle={s.createPad} keyboardShouldPersistTaps="handled">
          {/* Step 1 */}
          <Text style={s.stepTitle}><MaterialIcons name="person-search" size={15} /> Tìm người bán</Text>
          <View style={s.searchRow}>
            <TextInput
              style={[s.searchInput, { color: '#f1f5f9' }]} placeholderTextColor="#475569" autoCapitalize="none"
              value={sellerQuery} onChangeText={setSellerQuery}
              placeholder="Nhập username người bán…"
            />
            <Pressable style={s.searchBtn} onPress={() => void runSearchSeller()}>
              <MaterialIcons name="search" size={20} color="#0b1a2b" />
            </Pressable>
          </View>
          {sellerResults.map(u => (
            <Pressable key={u.id} style={[s.pickRow, selectedSeller?.id === u.id && s.pickRowActive]}
              onPress={() => { setSelectedSeller(u); void loadListings(u); }}>
              <MaterialIcons name="person" size={16} color={selectedSeller?.id === u.id ? '#38bdf8' : '#64748b'} style={{ marginRight: 8 }} />
              <Text style={[s.pickText, selectedSeller?.id === u.id && { color: '#38bdf8', fontWeight: '700' }]}>{u.username}</Text>
            </Pressable>
          ))}

          {/* Step 2 */}
          {selectedSeller && (
            <>
              <Text style={[s.stepTitle, { marginTop: 16 }]}><MaterialIcons name="storefront" size={15} /> Hàng của {selectedSeller.username}</Text>
              <View style={s.searchRow}>
                <TextInput style={[s.searchInput, { color: '#f1f5f9' }]} placeholderTextColor="#475569" value={listingQuery}
                  onChangeText={setListingQuery} placeholder="Lọc sản phẩm…" />
                <Pressable style={s.searchBtn} onPress={() => void loadListings(selectedSeller, listingQuery)}>
                  <MaterialIcons name="filter-list" size={20} color="#0b1a2b" />
                </Pressable>
              </View>
              {listingsLoading && <ActivityIndicator color="#38bdf8" style={{ marginVertical: 8 }} />}
              {listings.map(item => {
                const key = `${item.warehouseId}-${item.productId}`;
                return (
                  <View key={key} style={s.listingCard}>
                    <Text style={s.listingName}>{item.productName}</Text>
                    <Text style={s.listingMeta}>SKU {item.sku} · Kho {item.warehouseName} · Còn {item.availableQuantity}</Text>
                    <Text style={s.listingPrice}>{item.unitPrice.toLocaleString('vi-VN')} đ</Text>
                    <View style={s.searchRow}>
                      <TextInput style={[s.searchInput, { flex: 1, color: '#f1f5f9' }]} placeholderTextColor="#475569"
                        keyboardType="number-pad" placeholder="Số lượng"
                        value={listingQtyMap[key] ?? ''} onChangeText={v => setListingQtyMap(p => ({ ...p, [key]: v }))} />
                      <Pressable style={s.searchBtn} onPress={() => addToCart(item, listingQtyMap[key] ?? '')}>
                        <MaterialIcons name="add-shopping-cart" size={20} color="#0b1a2b" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Step 3 – Cart */}
          <Text style={[s.stepTitle, { marginTop: 16 }]}><MaterialIcons name="shopping-cart" size={15} /> Giỏ hàng ({cart.length})</Text>
          {cart.length === 0
            ? <Text style={s.emptyText}>Chưa có sản phẩm trong giỏ.</Text>
            : cart.map(item => (
              <View key={`${item.warehouseId}-${item.productId}`} style={s.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cartName}>{item.productName} × {item.quantity}</Text>
                  <Text style={s.cartMeta}>{(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ · Kho {item.warehouseName}</Text>
                </View>
                <Pressable onPress={() => setCart(p => p.filter(i => !(i.productId === item.productId && i.warehouseId === item.warehouseId)))}>
                  <MaterialIcons name="close" size={20} color="#f87171" />
                </Pressable>
              </View>
            ))
          }
          {cart.length > 0 && (
            <Pressable style={s.orderSubmitBtn} onPress={() => {
              const validWarehouses = myWarehouses.filter(w => !cart.some(c => c.warehouseId === w.id));
              if (!validWarehouses.length) { alert('Không có kho nhận nào hợp lệ. Các kho của bạn đang trùng với kho nguồn của sản phẩm trong giỏ.'); return; }
              setSelectedDestWarehouseId(validWarehouses[0]?.id ?? null);
              setChooseWarehouseOpen(true);
            }}>
              <MaterialIcons name="shopping-bag" size={18} color="#0b1a2b" style={{ marginRight: 8 }} />
              <Text style={s.orderSubmitText}>Đặt hàng</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* ── Choose warehouse modal ── */}
      <Modal visible={chooseWarehouseOpen} transparent animationType="fade" onRequestClose={() => setChooseWarehouseOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={s.backdrop} onPress={() => setChooseWarehouseOpen(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Chọn kho nhận hàng</Text>
            {(() => {
              const validWarehouses = myWarehouses.filter(w => !cart.some(c => c.warehouseId === w.id));
              return (
                <FlatList data={validWarehouses} keyExtractor={w => String(w.id)} style={{ maxHeight: 260 }}
                  renderItem={({ item }) => {
                    const sel = selectedDestWarehouseId === item.id;
                    return (
                      <Pressable style={[s.pickRow, sel && s.pickRowActive]} onPress={() => setSelectedDestWarehouseId(item.id)}>
                        <MaterialIcons name="store" size={16} color={sel ? '#38bdf8' : '#64748b'} style={{ marginRight: 8 }} />
                        <View>
                          <Text style={[s.pickText, sel && { color: '#38bdf8', fontWeight: '700' }]}>{item.name}</Text>
                          <Text style={s.listingMeta}>{item.address || 'Chưa có địa chỉ'}</Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              );
            })()}
            <View style={s.modalActions}>
              <Pressable onPress={() => setChooseWarehouseOpen(false)} style={s.modalCancelBtn}>
                <Text style={{ color: '#94a3b8' }}>Hủy</Text>
              </Pressable>
              <Pressable style={s.orderSubmitBtn} onPress={() => void submitOrder()}>
                <Text style={s.orderSubmitText}>Xác nhận đặt hàng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(dark: boolean) {
  const bg = dark ? '#080f1c' : '#f8fafc';
  const surface = dark ? '#0d1b2e' : '#ffffff';
  const border = dark ? '#1e3a5f' : '#cbd5e1';
  const text = dark ? '#f1f5f9' : '#0f172a';
  const muted = dark ? '#64748b' : '#94a3b8';
  return StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    guestTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    guestHint: { fontSize: 14, textAlign: 'center' },
    // Main tabs
    mainTabBar: { flexDirection: 'row', backgroundColor: dark ? '#0a1525' : '#f1f5f9', borderBottomWidth: 1, borderBottomColor: border },
    mainTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    mainTabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#38bdf8' },
    mainTabText: { fontSize: 13, fontWeight: '600', color: muted },
    mainTabTextActive: { color: '#38bdf8' },
    // Role bar
    roleBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
    roleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: dark ? '#0d1b2e' : '#e2e8f0', borderWidth: 1, borderColor: border },
    roleBtnActive: { backgroundColor: dark ? '#0f2040' : '#dbeafe', borderColor: '#38bdf8' },
    roleText: { fontSize: 13, fontWeight: '600', color: muted },
    roleTextActive: { color: '#38bdf8' },
    // List
    listPad: { padding: 16, paddingBottom: 24 },
    emptyWrap: { alignItems: 'center', marginTop: 48, gap: 8 },
    emptyText: { fontSize: 14, color: muted, marginTop: 4 },
    // Order card
    orderCard: { backgroundColor: surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 15, fontWeight: '700', color: text },
    statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    orderMeta: { fontSize: 13, color: muted, marginBottom: 2 },
    orderItem: { fontSize: 12, color: muted, marginLeft: 4 },
    orderTotal: { fontSize: 16, fontWeight: '700', color: '#38bdf8', marginTop: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: dark ? '#0f2040' : '#eff6ff', borderWidth: 1, borderColor: '#38bdf8' },
    actionBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 14 },
    qrBlock: { marginTop: 12, alignItems: 'center' },
    qrTitle: { fontSize: 14, fontWeight: '700', color: '#fbbf24', marginBottom: 10 },
    qrWrap: { padding: 12, borderRadius: 12, backgroundColor: '#fff' },
    // Create panel
    createPad: { padding: 16, paddingBottom: 40 },
    stepTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    searchInput: { flex: 1, backgroundColor: dark ? '#0a1525' : '#f1f5f9', borderWidth: 1.5, borderColor: border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
    searchBtn: { backgroundColor: '#38bdf8', borderRadius: 12, width: 44, alignItems: 'center', justifyContent: 'center' },
    pickRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: border },
    pickRowActive: { borderColor: '#38bdf8', backgroundColor: dark ? '#0f2040' : '#eff6ff' },
    pickText: { fontSize: 14, color: text },
    listingCard: { backgroundColor: surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: border },
    listingName: { fontSize: 15, fontWeight: '700', color: text, marginBottom: 2 },
    listingMeta: { fontSize: 12, color: muted, marginBottom: 4 },
    listingPrice: { fontSize: 15, color: '#38bdf8', fontWeight: '700', marginBottom: 8 },
    cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: border, gap: 8 },
    cartName: { fontSize: 14, fontWeight: '600', color: text },
    cartMeta: { fontSize: 12, color: muted, marginTop: 2 },
    orderSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38bdf8', borderRadius: 14, paddingVertical: 13, marginTop: 12 },
    orderSubmitText: { color: '#0b1a2b', fontWeight: '700', fontSize: 15 },
    // Modal
    modalWrap: { flex: 1, justifyContent: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalCard: { margin: 24, backgroundColor: surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: border },
    modalTitle: { fontSize: 17, fontWeight: '700', color: text, marginBottom: 12 },
    modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
    modalCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  });
}
