import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  Swipeable,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAxiosErrorMessage } from '@/src/services/api';
import * as inventoryApi from '@/src/services/inventoryService';
import * as productApi from '@/src/services/productService';
import * as warehouseApi from '@/src/services/warehouseService';
import type { Product, Warehouse, WarehouseStockLine } from '@/src/types/models';

export default function WarehouseDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(dark), [dark]);

  const idRaw = Array.isArray(idParam) ? idParam[0] : idParam;
  const warehouseId = Number(idRaw);
  const idValid = Number.isFinite(warehouseId);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [lines, setLines] = useState<WarehouseStockLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoad, setProductsLoad] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [productsLoadError, setProductsLoadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [importPickId, setImportPickId] = useState<number | null>(null);
  const [importQty, setImportQty] = useState('');
  const [exportLine, setExportLine] = useState<WarehouseStockLine | null>(null);
  const [exportQty, setExportQty] = useState('');
  const [adjustLine, setAdjustLine] = useState<WarehouseStockLine | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductQty, setNewProductQty] = useState('0');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLine, setTransferLine] = useState<WarehouseStockLine | null>(null);
  const [transferToWarehouseId, setTransferToWarehouseId] = useState<number | null>(null);
  const [transferQty, setTransferQty] = useState('');
  const [transferTargets, setTransferTargets] = useState<Warehouse[]>([]);
  const [transferTargetsLoad, setTransferTargetsLoad] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const swipeRefs = useRef<Map<number, Swipeable | null>>(new Map());

  const openImport = useCallback(() => {
    setImportPickId(null);
    setImportQty('');
    setImportOpen(true);
  }, []);

  const openNewProductModal = useCallback(() => {
    setNewProductName('');
    setNewProductSku('');
    setNewProductQty('0');
    setNewProductOpen(true);
  }, []);

  const openTransferModal = useCallback(() => {
    setTransferLine(null);
    setTransferToWarehouseId(null);
    setTransferQty('');
    setTransferOpen(true);
  }, []);

  const filteredLines = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((l) => {
      const name = (l.productName ?? '').toLowerCase();
      const sku = (l.sku ?? '').toLowerCase();
      const idStr = String(l.productId);
      return name.includes(q) || sku.includes(q) || idStr.includes(q);
    });
  }, [lines, stockSearch]);

  const loadWarehouse = useCallback(async () => {
    if (!idValid) return;
    const { data } = await warehouseApi.getWarehouse(warehouseId);
    setWarehouse(data);
    navigation.setOptions({ title: data.name });
  }, [idValid, warehouseId, navigation]);

  const loadStocks = useCallback(async () => {
    if (!idValid) return;
    const { data } = await inventoryApi.getWarehouseStocks(warehouseId);
    setLines(data ?? []);
  }, [idValid, warehouseId]);

  const loadAll = useCallback(async () => {
    if (!idValid) {
      setLoadError('Mã kho không hợp lệ');
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      await Promise.all([loadWarehouse(), loadStocks()]);
    } catch (e) {
      setLoadError(getAxiosErrorMessage(e, 'Không tải được dữ liệu kho.'));
    } finally {
      setLoading(false);
    }
  }, [idValid, loadWarehouse, loadStocks]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadAll();
    }, [loadAll])
  );

  const onRefresh = useCallback(async () => {
    if (!idValid) return;
    setRefreshing(true);
    try {
      await loadAll();
    } catch {
      /* handled in loadAll */
    } finally {
      setRefreshing(false);
    }
  }, [idValid, loadAll]);

  const fetchProducts = useCallback(async () => {
    setProductsLoad('loading');
    setProductsLoadError(null);
    try {
      const { data } = await productApi.getProducts();
      setProducts(data ?? []);
      setProductsLoad('ok');
    } catch (e) {
      setProducts([]);
      setProductsLoad('error');
      setProductsLoadError(getAxiosErrorMessage(e, 'Không tải được sản phẩm.'));
    }
  }, []);

  useEffect(() => {
    if (!importOpen) return;
    void fetchProducts();
  }, [importOpen, fetchProducts]);

  useEffect(() => {
    if (!transferOpen) return;
    setTransferTargetsLoad('loading');
    warehouseApi
      .getWarehouses()
      .then(({ data }) => {
        const filtered = (data ?? []).filter((w) => w.id !== warehouseId);
        setTransferTargets(filtered);
        setTransferTargetsLoad('ok');
      })
      .catch(() => {
        setTransferTargets([]);
        setTransferTargetsLoad('error');
      });
  }, [transferOpen, warehouseId]);

  const openAdjust = (line: WarehouseStockLine) => {
    setAdjustLine(line);
    setAdjustQty(String(line.quantity));
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    if (!adjustLine || !idValid) return;
    const q = parseInt(adjustQty.replace(/\s/g, ''), 10);
    if (!Number.isFinite(q) || q < 0) {
      Alert.alert('Lỗi', 'Nhập số lượng hợp lệ (≥ 0).');
      return;
    }
    setBusy(true);
    try {
      await inventoryApi.setWarehouseStockQuantity(warehouseId, adjustLine.productId, q);
      setAdjustOpen(false);
      setAdjustLine(null);
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không cập nhật được tồn kho.'));
    } finally {
      setBusy(false);
    }
  };

  const submitCreateProductInWarehouse = async () => {
    if (!idValid) return;
    const name = newProductName.trim();
    const sku = newProductSku.trim();
    if (!name || !sku) {
      Alert.alert('Lỗi', 'Nhập tên và SKU cho sản phẩm mới.');
      return;
    }
    const q = parseInt(newProductQty.replace(/\s/g, ''), 10);
    if (!Number.isFinite(q) || q < 0) {
      Alert.alert('Lỗi', 'Số lượng ban đầu phải ≥ 0.');
      return;
    }
    setBusy(true);
    try {
      const { data: created } = await productApi.createProduct({ name, sku });
      const pid = created?.id;
      if (pid == null) {
        Alert.alert('Lỗi', 'Server không trả về mã sản phẩm.');
        return;
      }
      await inventoryApi.importToWarehouse(warehouseId, [{ productId: pid, quantity: q }]);
      setNewProductOpen(false);
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không tạo được sản phẩm hoặc thêm vào kho.'));
    } finally {
      setBusy(false);
    }
  };

  const promptRemoveFromWarehouse = (line: WarehouseStockLine) => {
    swipeRefs.current.get(line.productId)?.close();
    Alert.alert(
      'Gỡ khỏi kho',
      `Xóa “${line.productName || 'sản phẩm'}” khỏi kho này?\n\nSản phẩm vẫn còn trong danh mục hệ thống; chỉ bỏ dòng tồn tại kho.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gỡ khỏi kho',
          style: 'destructive',
          onPress: () => void removeLineFromWarehouse(line),
        },
      ]
    );
  };

  const removeLineFromWarehouse = async (line: WarehouseStockLine) => {
    if (!idValid) return;
    setBusy(true);
    try {
      await inventoryApi.removeStockLineFromWarehouse(warehouseId, line.productId);
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Không gỡ được sản phẩm khỏi kho.'));
    } finally {
      setBusy(false);
    }
  };

  const submitImport = async () => {
    if (!idValid || importPickId == null) {
      Alert.alert('Lỗi', 'Chọn sản phẩm.');
      return;
    }
    const q = parseInt(importQty.replace(/\s/g, ''), 10);
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Lỗi', 'Nhập số lượng nhập kho > 0.');
      return;
    }
    setBusy(true);
    try {
      await inventoryApi.importToWarehouse(warehouseId, [{ productId: importPickId, quantity: q }]);
      setImportOpen(false);
      setImportPickId(null);
      setImportQty('');
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Nhập kho thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  const submitExport = async () => {
    if (!idValid || !exportLine) return;
    const q = parseInt(exportQty.replace(/\s/g, ''), 10);
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Lỗi', 'Nhập số lượng xuất > 0.');
      return;
    }
    if (q > exportLine.quantity) {
      Alert.alert('Lỗi', `Trong kho chỉ còn ${exportLine.quantity}.`);
      return;
    }
    setBusy(true);
    try {
      await inventoryApi.exportFromWarehouse(warehouseId, [{ productId: exportLine.productId, quantity: q }]);
      setExportOpen(false);
      setExportLine(null);
      setExportQty('');
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Xuất kho thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async () => {
    if (!idValid || !transferLine || transferToWarehouseId == null) {
      Alert.alert('Lỗi', 'Chọn sản phẩm và kho đích.');
      return;
    }
    const q = parseInt(transferQty.replace(/\s/g, ''), 10);
    if (!Number.isFinite(q) || q <= 0) {
      Alert.alert('Lỗi', 'Nhập số lượng chuyển > 0.');
      return;
    }
    if (q > transferLine.quantity) {
      Alert.alert('Lỗi', `Trong kho chỉ còn ${transferLine.quantity}.`);
      return;
    }
    setBusy(true);
    try {
      await inventoryApi.transferStock(warehouseId, {
        productId: transferLine.productId,
        toWarehouse: transferToWarehouseId,
        quantity: q,
      });
      setTransferOpen(false);
      setTransferLine(null);
      setTransferToWarehouseId(null);
      setTransferQty('');
      await loadStocks();
    } catch (e) {
      Alert.alert('Lỗi', getAxiosErrorMessage(e, 'Chuyển kho thất bại.'));
    } finally {
      setBusy(false);
    }
  };

  if (!idValid) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Mã kho không hợp lệ.</Text>
      </View>
    );
  }

  if (loading && !warehouse && !loadError) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (loadError && !warehouse) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center', paddingHorizontal: 24 }}>{loadError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
      {warehouse ? (
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Vuốt dòng sang trái để gỡ khỏi kho — chạm dòng để kiểm kê. Nút + tạo sản phẩm mới trong kho.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionImport, pressed && styles.pressed]}
          onPress={openImport}>
          <Text style={[styles.actionBtnTextBase, { color: dark ? '#f8fafc' : '#166534' }]}>Nhập kho</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionExport, pressed && styles.pressed]}
          onPress={() => {
            setExportLine(null);
            setExportQty('');
            setExportOpen(true);
          }}>
          <Text style={[styles.actionBtnTextBase, { color: dark ? '#f8fafc' : '#b91c1c' }]}>Xuất kho</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            borderColor: dark ? '#334155' : '#cbd5e1',
            backgroundColor: dark ? '#0f172a' : '#f8fafc',
          },
        ]}>
        <MaterialIcons name="search" size={22} color={theme.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={stockSearch}
          onChangeText={setStockSearch}
          placeholder="Tìm theo tên, SKU hoặc mã sản phẩm…"
          placeholderTextColor={theme.icon}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {stockSearch.length > 0 ? (
          <Pressable onPress={() => setStockSearch('')} hitSlop={12} style={styles.searchClear}>
            <MaterialIcons name="close" size={20} color={theme.icon} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredLines}
        keyExtractor={(l) => String(l.productId)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom + 88, 100) },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.icon }]}>
            {lines.length === 0
              ? 'Chưa có dòng tồn kho. Nút + tạo sản phẩm mới; Nhập kho để thêm hàng từ danh mục có sẵn.'
              : `Không có sản phẩm khớp “${stockSearch.trim()}”.`}
          </Text>
        }
        renderItem={({ item }) => (
          <Swipeable
            ref={(el) => {
              if (el) swipeRefs.current.set(item.productId, el);
              else swipeRefs.current.delete(item.productId);
            }}
            overshootRight={false}
            renderRightActions={() => (
              <View style={styles.swipeActions}>
                <Pressable
                  style={styles.swipeDelete}
                  onPress={() => promptRemoveFromWarehouse(item)}
                  disabled={busy}>
                  <MaterialIcons name="delete-outline" size={26} color="#fff" />
                  <Text style={styles.swipeDeleteLabel}>Gỡ</Text>
                </Pressable>
              </View>
            )}>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: dark ? '#1e293b' : '#f1f5f9' }]}
              activeOpacity={0.85}
              onPress={() => openAdjust(item)}>
              <View style={styles.rowMain}>
                <Text style={[styles.name, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.sku, { color: theme.icon }]}>SKU: {item.sku}</Text>
              </View>
              <Text style={[styles.qty, { color: theme.tint }]}>{item.quantity}</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />

      {!importOpen && !exportOpen && !adjustOpen && !newProductOpen && !transferOpen ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chuyển sản phẩm giữa các kho"
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: dark ? '#0ea5e9' : '#0284c7',
                bottom: Math.max(insets.bottom, 12) + 84,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={openTransferModal}>
            <MaterialIcons name="swap-horiz" size={28} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tạo sản phẩm mới trong kho"
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: theme.tint,
                bottom: Math.max(insets.bottom, 12) + 16,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={openNewProductModal}>
            <MaterialIcons name="add" size={30} color="#fff" />
          </Pressable>
        </>
      ) : null}

      {/* Kiểm kê — đặt số lượng thực tế */}
      <Modal visible={adjustOpen} transparent animationType="fade" onRequestClose={() => setAdjustOpen(false)}>
        <View style={styles.modalCenterWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => !busy && setAdjustOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: dark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Kiểm kê tồn</Text>
            {adjustLine ? (
              <Text style={[styles.modalMeta, { color: theme.icon }]}>
                {adjustLine.productName} · hiện tại: {adjustLine.quantity}
              </Text>
            ) : null}
            <Text style={[styles.inputLabel, { color: theme.icon }]}>Số lượng sau kiểm</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={adjustQty}
              onChangeText={setAdjustQty}
              keyboardType="number-pad"
              editable={!busy}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => !busy && setAdjustOpen(false)}>
                <Text style={{ color: theme.text }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, { backgroundColor: theme.tint }]}
                onPress={() => void submitAdjust()}
                disabled={busy}>
                <Text style={styles.modalPrimaryText}>{busy ? '…' : 'Lưu'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Nhập kho */}
      <Modal visible={importOpen} transparent animationType="fade" onRequestClose={() => !busy && setImportOpen(false)}>
        <View style={styles.modalBottomWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => !busy && setImportOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Nhập kho</Text>
          <Text style={[styles.modalMeta, { color: theme.icon }]}>Chọn sản phẩm và số lượng nhận.</Text>
          <Text style={[styles.inputLabel, { color: theme.icon }]}>Số lượng</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
            value={importQty}
            onChangeText={setImportQty}
            keyboardType="number-pad"
            placeholder="VD: 10"
            placeholderTextColor={theme.icon}
            editable={!busy}
          />
          <FlatList
            style={styles.modalList}
            data={products}
            keyExtractor={(p) => String(p.id)}
            ListEmptyComponent={
              productsLoad === 'loading' ? (
                <Text style={{ color: theme.icon, padding: 16 }}>Đang tải sản phẩm…</Text>
              ) : productsLoad === 'error' ? (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: theme.text, marginBottom: 12 }}>{productsLoadError}</Text>
                  <Pressable
                    style={[styles.modalPrimary, { backgroundColor: theme.tint, alignSelf: 'flex-start' }]}
                    onPress={() => void fetchProducts()}>
                    <Text style={styles.modalPrimaryText}>Thử lại</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={{ color: theme.icon, padding: 16, lineHeight: 22 }}>
                  Chưa có sản phẩm từ server. Nếu bạn nhập SQL tay, bảng phải trùng tên Hibernate (thường là
                  product, không phải products). Hoặc tạo sản phẩm qua POST /api/products.
                </Text>
              )
            }
            renderItem={({ item }) => {
              const sel = importPickId === item.id;
              return (
                <Pressable
                  style={[styles.pickRow, sel && { backgroundColor: dark ? '#334155' : '#e2e8f0' }]}
                  onPress={() => setImportPickId(item.id)}>
                  <Text style={{ color: theme.text, fontWeight: sel ? '700' : '400' }}>{item.name}</Text>
                  <Text style={{ color: theme.icon, fontSize: 13 }}>{item.sku}</Text>
                </Pressable>
              );
            }}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondary} onPress={() => !busy && setImportOpen(false)}>
              <Text style={{ color: theme.text }}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.modalPrimary, { backgroundColor: theme.tint }]}
              onPress={() => void submitImport()}
              disabled={busy}>
              <Text style={styles.modalPrimaryText}>{busy ? '…' : 'Xác nhận'}</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </Modal>

      {/* Xuất kho */}
      <Modal visible={exportOpen} transparent animationType="fade" onRequestClose={() => !busy && setExportOpen(false)}>
        <View style={styles.modalBottomWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => !busy && setExportOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Xuất kho</Text>
          <Text style={[styles.modalMeta, { color: theme.icon }]}>
            Hàng hỏng, tiêu hủy hoặc xuất bỏ — chọn sản phẩm trong kho.
          </Text>
          {!exportLine ? (
            <FlatList
              style={styles.modalList}
              data={lines.filter((l) => l.quantity > 0)}
              keyExtractor={(l) => String(l.productId)}
              ListEmptyComponent={
                <Text style={{ color: theme.icon, padding: 16 }}>Không có hàng để xuất.</Text>
              }
              renderItem={({ item }) => (
                <Pressable style={styles.pickRow} onPress={() => setExportLine(item)}>
                  <Text style={{ color: theme.text }}>{item.productName}</Text>
                  <Text style={{ color: theme.tint }}>Còn: {item.quantity}</Text>
                </Pressable>
              )}
            />
          ) : (
            <>
              <Text style={[styles.modalMeta, { color: theme.text }]}>
                {exportLine.productName} (tối đa {exportLine.quantity})
              </Text>
              <Text style={[styles.inputLabel, { color: theme.icon }]}>Số lượng xuất</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                value={exportQty}
                onChangeText={setExportQty}
                keyboardType="number-pad"
                editable={!busy}
              />
              <Pressable onPress={() => !busy && setExportLine(null)} style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.tint }}>← Chọn sản phẩm khác</Text>
              </Pressable>
              <View style={styles.modalActions}>
                <Pressable style={styles.modalSecondary} onPress={() => !busy && setExportOpen(false)}>
                  <Text style={{ color: theme.text }}>Hủy</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalPrimary, { backgroundColor: theme.tint }]}
                  onPress={() => void submitExport()}
                  disabled={busy}>
                  <Text style={styles.modalPrimaryText}>{busy ? '…' : 'Xác nhận'}</Text>
                </Pressable>
              </View>
            </>
          )}
          {!exportLine ? (
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => !busy && setExportOpen(false)}>
                <Text style={{ color: theme.text }}>Đóng</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        </View>
      </Modal>

      {/* Tạo sản phẩm mới + thêm vào kho này */}
      <Modal
        visible={newProductOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setNewProductOpen(false)}>
        <View style={styles.modalCenterWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => !busy && setNewProductOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: dark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sản phẩm mới trong kho</Text>
            <Text style={[styles.modalMeta, { color: theme.icon }]}>
              Tạo bản ghi sản phẩm mới (tên + SKU) và mở tồn tại kho này.
            </Text>
            <Text style={[styles.inputLabel, { color: theme.icon }]}>Tên sản phẩm</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={newProductName}
              onChangeText={setNewProductName}
              placeholder="VD: Bút bi xanh"
              placeholderTextColor={theme.icon}
              editable={!busy}
            />
            <Text style={[styles.inputLabel, { color: theme.icon }]}>SKU</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={newProductSku}
              onChangeText={setNewProductSku}
              placeholder="VD: BUT-XANH-01"
              placeholderTextColor={theme.icon}
              autoCapitalize="characters"
              editable={!busy}
            />
            <Text style={[styles.inputLabel, { color: theme.icon }]}>Số lượng ban đầu</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={newProductQty}
              onChangeText={setNewProductQty}
              keyboardType="number-pad"
              editable={!busy}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => !busy && setNewProductOpen(false)}>
                <Text style={{ color: theme.text }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, { backgroundColor: theme.tint }]}
                onPress={() => void submitCreateProductInWarehouse()}
                disabled={busy}>
                <Text style={styles.modalPrimaryText}>{busy ? '…' : 'Tạo & thêm vào kho'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Chuyển sản phẩm giữa các kho quản lý */}
      <Modal
        visible={transferOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setTransferOpen(false)}>
        <View style={styles.modalBottomWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => !busy && setTransferOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Chuyển kho</Text>
            <Text style={[styles.modalMeta, { color: theme.icon }]}>
              Chọn sản phẩm từ kho hiện tại, kho đích và số lượng chuyển.
            </Text>

            <Text style={[styles.inputLabel, { color: theme.icon }]}>1) Sản phẩm cần chuyển</Text>
            {!transferLine ? (
              <FlatList
                style={styles.modalList}
                data={lines.filter((l) => l.quantity > 0)}
                keyExtractor={(l) => String(l.productId)}
                ListEmptyComponent={
                  <Text style={{ color: theme.icon, padding: 16 }}>
                    Không có sản phẩm khả dụng để chuyển.
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable style={styles.pickRow} onPress={() => setTransferLine(item)}>
                    <Text style={{ color: theme.text }}>{item.productName}</Text>
                    <Text style={{ color: theme.tint }}>Còn: {item.quantity}</Text>
                  </Pressable>
                )}
              />
            ) : (
              <Pressable style={[styles.pickRow, { marginBottom: 8 }]} onPress={() => setTransferLine(null)}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>
                  {transferLine.productName || `Mã ${transferLine.productId}`}
                </Text>
                <Text style={{ color: theme.icon }}>Đang chọn (còn {transferLine.quantity}) · chạm để đổi</Text>
              </Pressable>
            )}

            <Text style={[styles.inputLabel, { color: theme.icon }]}>2) Kho đích</Text>
            <FlatList
              style={styles.modalList}
              data={transferTargets}
              keyExtractor={(w) => String(w.id)}
              ListEmptyComponent={
                transferTargetsLoad === 'loading' ? (
                  <Text style={{ color: theme.icon, padding: 16 }}>Đang tải kho...</Text>
                ) : transferTargetsLoad === 'error' ? (
                  <Text style={{ color: theme.icon, padding: 16 }}>
                    Không tải được danh sách kho đích.
                  </Text>
                ) : (
                  <Text style={{ color: theme.icon, padding: 16 }}>
                    Bạn chưa được gán thêm kho nào khác để chuyển.
                  </Text>
                )
              }
              renderItem={({ item }) => {
                const selected = transferToWarehouseId === item.id;
                return (
                  <Pressable
                    style={[styles.pickRow, selected && { backgroundColor: dark ? '#334155' : '#e2e8f0' }]}
                    onPress={() => setTransferToWarehouseId(item.id)}>
                    <Text style={{ color: theme.text, fontWeight: selected ? '700' : '400' }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: theme.icon, fontSize: 13 }}>Mã kho: {item.id}</Text>
                  </Pressable>
                );
              }}
            />

            <Text style={[styles.inputLabel, { color: theme.icon }]}>3) Số lượng chuyển</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
              value={transferQty}
              onChangeText={setTransferQty}
              keyboardType="number-pad"
              placeholder="VD: 5"
              placeholderTextColor={theme.icon}
              editable={!busy}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={() => !busy && setTransferOpen(false)}>
                <Text style={{ color: theme.text }}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, { backgroundColor: theme.tint }]}
                onPress={() => void submitTransfer()}
                disabled={busy}>
                <Text style={styles.modalPrimaryText}>{busy ? '…' : 'Chuyển kho'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

function makeStyles(dark: boolean) {
  return StyleSheet.create({
    gestureRoot: { flex: 1 },
    root: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    actions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    actionImport: { backgroundColor: dark ? '#14532d' : '#dcfce7' },
    actionExport: { backgroundColor: dark ? '#7f1d1d' : '#fee2e2' },
    actionBtnTextBase: { fontWeight: '700', fontSize: 15 },
    pressed: { opacity: 0.85 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
    searchClear: { padding: 4 },
    fab: {
      position: 'absolute',
      right: 20,
      zIndex: 20,
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
    list: { paddingHorizontal: 16, flexGrow: 1 },
    swipeActions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 10,
      borderRadius: 12,
      overflow: 'hidden',
    },
    swipeDelete: {
      backgroundColor: '#b91c1c',
      justifyContent: 'center',
      alignItems: 'center',
      width: 88,
      paddingVertical: 8,
    },
    swipeDeleteLabel: { color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
    },
    rowMain: { flex: 1, marginRight: 12 },
    name: { fontSize: 16, fontWeight: '600' },
    sku: { fontSize: 13, marginTop: 4 },
    qty: { fontSize: 20, fontWeight: '700' },
    empty: { textAlign: 'center', marginTop: 32, fontSize: 15 },
    modalCenterWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    modalBottomWrap: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalCard: {
      marginHorizontal: 24,
      alignSelf: 'center',
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 20,
    },
    modalSheet: {
      maxHeight: '88%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      paddingBottom: 28,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    modalMeta: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
    inputLabel: { fontSize: 13, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 16,
    },
    modalList: { maxHeight: 280, marginBottom: 8 },
    pickRow: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 6,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
    modalSecondary: { paddingVertical: 10, paddingHorizontal: 12 },
    modalPrimary: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    modalPrimaryText: { color: '#fff', fontWeight: '700' },
  });
}
