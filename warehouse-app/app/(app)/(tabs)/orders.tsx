import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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

function statusLabel(status: Order['status']) {
  switch (status) {
    case 'PENDING_SELLER_CONFIRM':
      return 'Chờ người bán xác nhận';
    case 'IN_TRANSIT':
      return 'Đang giao hàng';
    case 'AWAITING_PAYMENT':
      return 'Chờ thanh toán';
    case 'COMPLETED':
      return 'Thành công';
    case 'REJECTED':
      return 'Đã từ chối';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}

export default function OrdersScreen() {
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => makeStyles(dark), [dark]);

  const [role, setRole] = useState<RoleTab>('buyer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [myWarehouses, setMyWarehouses] = useState<Warehouse[]>([]);

  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerResults, setSellerResults] = useState<UserBrief[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<UserBrief | null>(null);
  const [listingQuery, setListingQuery] = useState('');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [listingQtyMap, setListingQtyMap] = useState<Record<string, string>>({});
  const [chooseWarehouseOpen, setChooseWarehouseOpen] = useState(false);
  const [selectedDestinationWarehouseId, setSelectedDestinationWarehouseId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    if (session == null) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    const [{ data: dataOrders }, { data: whs }] = await Promise.all([
      orderApi.getOrders(role),
      warehouseApi.getWarehouses(),
    ]);
    setOrders(dataOrders ?? []);
    setMyWarehouses(whs ?? []);
  }, [role, session]);

  useFocusEffect(
    useCallback(() => {
      setOrdersLoading(true);
      loadOrders()
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }, [loadOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  }, [loadOrders]);

  const runSearchSeller = async () => {
    const q = sellerQuery.trim();
    if (q.length < 2) return;
    try {
      const { data } = await userApi.searchUsers(q);
      setSellerResults(data ?? []);
    } catch {
      setSellerResults([]);
    }
  };

  const loadListings = async (seller: UserBrief, query?: string) => {
    setListingsLoading(true);
    try {
      const { data } = await marketplaceApi.getSellerListings(seller.id, query);
      setListings(data ?? []);
    } catch {
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

  const addToCart = (listing: MarketplaceListing, qtyRaw: string) => {
    const qty = parseInt(qtyRaw.replace(/\s/g, ''), 10);
    if (!Number.isFinite(qty) || qty <= 0) return;
    if (qty > listing.availableQuantity) return;
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === listing.productId && i.warehouseId === listing.warehouseId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: qty };
        return next;
      }
      return [...prev, { ...listing, quantity: qty }];
    });
  };

  const removeFromCart = (line: CartLine) => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === line.productId && i.warehouseId === line.warehouseId))
    );
  };

  const submitOrder = async () => {
    if (selectedSeller == null || cart.length === 0 || selectedDestinationWarehouseId == null) return;
    try {
      await orderApi.createOrder({
        sellerId: selectedSeller.id,
        destinationWarehouseId: selectedDestinationWarehouseId,
        items: cart.map((c) => ({
          warehouseId: c.warehouseId,
          productId: c.productId,
          quantity: c.quantity,
        })),
      });
      setCart([]);
      setSelectedDestinationWarehouseId(null);
      setChooseWarehouseOpen(false);
      await loadOrders();
    } catch (e) {
      alert(getAxiosErrorMessage(e, 'Tạo đơn thất bại.'));
    }
  };

  const runSellerConfirm = async (orderId: number) => {
    setBusyOrderId(orderId);
    try {
      await orderApi.sellerConfirmOrder(orderId);
      await loadOrders();
    } catch (e) {
      alert(getAxiosErrorMessage(e, 'Xác nhận đơn thất bại.'));
    } finally {
      setBusyOrderId(null);
    }
  };

  const runBuyerReceived = async (orderId: number) => {
    setBusyOrderId(orderId);
    try {
      await orderApi.buyerConfirmReceived(orderId);
      await loadOrders();
    } catch (e) {
      alert(getAxiosErrorMessage(e, 'Xác nhận nhận hàng thất bại.'));
    } finally {
      setBusyOrderId(null);
    }
  };

  const runSellerConfirmPayment = async (orderId: number) => {
    setBusyOrderId(orderId);
    try {
      await orderApi.sellerConfirmPayment(orderId);
      await loadOrders();
    } catch (e) {
      alert(getAxiosErrorMessage(e, 'Xác nhận thanh toán thất bại.'));
    } finally {
      setBusyOrderId(null);
    }
  };

  if (session == null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Chưa đăng nhập</Text>
        <Text style={{ color: theme.icon, textAlign: 'center', paddingHorizontal: 24 }}>
          Vào tab Cá nhân để đăng nhập và sử dụng chức năng đặt hàng giữa người dùng.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.roleSwitch}>
        <Pressable
          style={[styles.roleBtn, role === 'buyer' && { backgroundColor: theme.tint }]}
          onPress={() => setRole('buyer')}>
          <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>Bên mua</Text>
        </Pressable>
        <Pressable
          style={[styles.roleBtn, role === 'seller' && { backgroundColor: theme.tint }]}
          onPress={() => setRole('seller')}>
          <Text style={[styles.roleText, role === 'seller' && styles.roleTextActive]}>Bên bán</Text>
        </Pressable>
      </View>

      {role === 'buyer' ? (
        <ScrollView contentContainerStyle={styles.buyerPanel}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1) Tìm người bán</Text>
          <View style={styles.rowInline}>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon, flex: 1, marginBottom: 0 }]}
              value={sellerQuery}
              onChangeText={setSellerQuery}
              placeholder="Nhập username người bán..."
              placeholderTextColor={theme.icon}
            />
            <Pressable style={[styles.primaryBtn, { backgroundColor: theme.tint }]} onPress={() => void runSearchSeller()}>
              <Text style={styles.primaryBtnText}>Tìm</Text>
            </Pressable>
          </View>

          <FlatList
            data={sellerResults}
            keyExtractor={(u) => String(u.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.pickRow, selectedSeller?.id === item.id && { backgroundColor: dark ? '#334155' : '#e2e8f0' }]}
                onPress={() => {
                  setSelectedSeller(item);
                  void loadListings(item);
                }}>
                <Text style={{ color: theme.text, fontWeight: selectedSeller?.id === item.id ? '700' : '400' }}>
                  {item.username}
                </Text>
              </Pressable>
            )}
          />

          {selectedSeller ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                2) Hàng đang bán của {selectedSeller.username}
              </Text>
              <View style={styles.rowInline}>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.icon, flex: 1, marginBottom: 0 }]}
                  value={listingQuery}
                  onChangeText={setListingQuery}
                  placeholder="Lọc theo tên/SKU..."
                  placeholderTextColor={theme.icon}
                />
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                  onPress={() => void loadListings(selectedSeller, listingQuery)}>
                  <Text style={styles.primaryBtnText}>Lọc</Text>
                </Pressable>
              </View>
              {listingsLoading ? <ActivityIndicator color={theme.tint} style={{ marginVertical: 12 }} /> : null}
              <FlatList
                data={listings}
                keyExtractor={(i) => `${i.warehouseId}-${i.productId}`}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const rowKey = `${item.warehouseId}-${item.productId}`;
                  return (
                    <View style={styles.card}>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{item.productName}</Text>
                      <Text style={{ color: theme.icon }}>
                        SKU {item.sku} · Kho {item.warehouseName} · Còn {item.availableQuantity}
                      </Text>
                      <Text style={{ color: theme.icon, fontSize: 12 }}>
                        Địa chỉ kho: {item.warehouseAddress || 'Chưa có địa chỉ'}
                      </Text>
                      <Text style={{ color: theme.text, marginTop: 4 }}>Giá: {item.unitPrice.toLocaleString('vi-VN')} đ</Text>
                      <View style={styles.rowInline}>
                        <TextInput
                          style={[styles.input, { color: theme.text, borderColor: theme.icon, flex: 1, marginBottom: 0 }]}
                          placeholder="SL"
                          placeholderTextColor={theme.icon}
                          keyboardType="number-pad"
                          value={listingQtyMap[rowKey] ?? ''}
                          onChangeText={(v) => setListingQtyMap((prev) => ({ ...prev, [rowKey]: v }))}
                        />
                        <Pressable
                          style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                          onPress={() => addToCart(item, listingQtyMap[rowKey] ?? '')}>
                          <Text style={styles.primaryBtnText}>Thêm</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }}
              />
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>3) Giỏ hàng</Text>
          <FlatList
            data={cart}
            keyExtractor={(i) => `${i.warehouseId}-${i.productId}`}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={{ color: theme.icon }}>Chưa có sản phẩm trong giỏ.</Text>}
            renderItem={({ item }) => (
              <View style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>
                    {item.productName} x {item.quantity}
                  </Text>
                  <Text style={{ color: theme.icon, fontSize: 12 }}>
                    Kho {item.warehouseName} · {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                <Pressable onPress={() => removeFromCart(item)}>
                  <Text style={{ color: '#dc2626', fontWeight: '700' }}>Xóa</Text>
                </Pressable>
              </View>
            )}
          />
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.tint, marginTop: 8, alignSelf: 'flex-start' }]}
            onPress={() => {
              if (myWarehouses.length === 0) {
                alert('Bạn chưa có kho nhận hàng. Hãy tạo kho trước.');
                return;
              }
              setSelectedDestinationWarehouseId(myWarehouses[0]?.id ?? null);
              setChooseWarehouseOpen(true);
            }}>
            <Text style={styles.primaryBtnText}>Đặt hàng</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      <Modal
        visible={chooseWarehouseOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChooseWarehouseOpen(false)}>
        <View style={styles.modalWrap}>
          <Pressable style={styles.backdrop} onPress={() => setChooseWarehouseOpen(false)} />
          <View style={[styles.card, { backgroundColor: dark ? '#1e293b' : '#fff', marginHorizontal: 24 }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Chọn kho nhận hàng</Text>
            <FlatList
              data={myWarehouses}
              keyExtractor={(w) => String(w.id)}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => {
                const selected = selectedDestinationWarehouseId === item.id;
                return (
                  <Pressable
                    style={[styles.pickRow, selected && { backgroundColor: dark ? '#334155' : '#e2e8f0' }]}
                    onPress={() => setSelectedDestinationWarehouseId(item.id)}>
                    <Text style={{ color: theme.text, fontWeight: selected ? '700' : '400' }}>{item.name}</Text>
                    <Text style={{ color: theme.icon, fontSize: 12 }}>
                      {item.address || 'Chưa có địa chỉ'} · {item.phone || 'Chưa có SĐT'}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <View style={styles.rowInline}>
              <Pressable onPress={() => setChooseWarehouseOpen(false)}>
                <Text style={{ color: theme.text }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.tint }]}
                onPress={() => void submitOrder()}>
                <Text style={styles.primaryBtnText}>Xác nhận đặt hàng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16, marginTop: 6 }]}>
        Danh sách đơn ({role === 'buyer' ? 'Bên mua' : 'Bên bán'})
      </Text>
      {ordersLoading ? <ActivityIndicator color={theme.tint} style={{ marginTop: 16 }} /> : null}
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ color: theme.icon }}>Chưa có đơn hàng nào.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Đơn #{item.id}</Text>
            <Text style={{ color: theme.icon }}>
              Mua: {item.buyerUsername} · Bán: {item.sellerUsername}
            </Text>
            <Text style={{ color: theme.text, marginTop: 4 }}>Trạng thái: {statusLabel(item.status)}</Text>
            <Text style={{ color: theme.text }}>Tổng: {item.totalAmount.toLocaleString('vi-VN')} đ</Text>
            <Text style={{ color: theme.icon, fontSize: 12 }}>
              Kho nhận: {item.destinationWarehouseName || `#${item.destinationWarehouseId}`}
            </Text>
            <Text style={{ color: theme.icon, fontSize: 12 }}>
              Địa chỉ: {item.recipientAddress || 'Chưa có'} · SĐT: {item.recipientPhone || 'Chưa có'}
            </Text>
            {item.items.map((it) => (
              <Text key={it.id} style={{ color: theme.icon, fontSize: 12 }}>
                - {it.productName} x {it.quantity} (kho nguồn {it.sourceWarehouseId})
              </Text>
            ))}

            {role === 'seller' && item.status === 'PENDING_SELLER_CONFIRM' ? (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.tint, marginTop: 8, alignSelf: 'flex-start' }]}
                disabled={busyOrderId === item.id}
                onPress={() => void runSellerConfirm(item.id)}>
                <Text style={styles.primaryBtnText}>{busyOrderId === item.id ? '...' : 'Xác nhận & gửi hàng'}</Text>
              </Pressable>
            ) : null}

            {role === 'buyer' && item.status === 'IN_TRANSIT' ? (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: '#16a34a', marginTop: 8, alignSelf: 'flex-start' }]}
                disabled={busyOrderId === item.id}
                onPress={() => void runBuyerReceived(item.id)}>
                <Text style={styles.primaryBtnText}>{busyOrderId === item.id ? '...' : 'Đã nhận hàng'}</Text>
              </Pressable>
            ) : null}

            {role === 'seller' && item.status === 'AWAITING_PAYMENT' ? (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: '#16a34a', marginTop: 8, alignSelf: 'flex-start' }]}
                disabled={busyOrderId === item.id}
                onPress={() => void runSellerConfirmPayment(item.id)}>
                <Text style={styles.primaryBtnText}>{busyOrderId === item.id ? '...' : 'Xác nhận đã nhận tiền'}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(dark: boolean) {
  return StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    roleSwitch: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
    roleBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: dark ? '#1e293b' : '#e2e8f0',
    },
    roleText: { fontWeight: '700' },
    roleTextActive: { color: '#fff' },
    buyerPanel: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    rowInline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 10,
    },
    primaryBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    pickRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 6,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    card: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    cardTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
    cartRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 10,
      padding: 10,
      marginBottom: 6,
      backgroundColor: dark ? '#1e293b' : '#f1f5f9',
    },
    modalWrap: { flex: 1, justifyContent: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  });
}
