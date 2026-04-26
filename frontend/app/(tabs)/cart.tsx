import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getCart, updateCartItem, removeCartItem, checkout, Order } from '../../services/api';

export default function CartScreen() {
  const [cart, setCart] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadCart() {
    try {
      setError('');
      const data = await getCart();
      setCart(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadCart(); }, []));

  async function handleUpdateQty(itemId: string, qty: number) {
    if (qty < 1) { handleRemove(itemId); return; }
    setUpdatingId(itemId);
    try {
      const updated = await updateCartItem(itemId, qty);
      setCart(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setUpdatingId(itemId);
    try {
      await removeCartItem(itemId);
      await loadCart();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    setError('');
    try {
      await checkout();
      setCart(null);
      setSuccess('Pedido enviado para a cozinha! 🎀');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e91e8c" size="large" />
        <Text style={styles.loadingText}>Carregando carrinho...</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Pedido enviado!</Text>
        <Text style={styles.successSub}>As maids já estão preparando tudo com carinho ♡</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setSuccess(''); loadCart(); }}>
          <Text style={styles.backBtnText}>Ver carrinho</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Meu Carrinho</Text>
        {cart && <Text style={styles.headerSub}>Mesa {cart.tableNumber}</Text>}
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      {isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyTitle}>Carrinho vazio</Text>
          <Text style={styles.emptySub}>Adicione itens do cardápio para começar!</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCart(); }} tintColor="#e91e8c" />}
          >
            {cart!.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Image 
                  source={{ uri: item.product.imageUrl }} 
                  style={styles.itemImage} 
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemUnit}>R$ {item.price.toFixed(2).replace('.', ',')} cada</Text>
                </View>

                <View style={styles.itemRight}>
                  <Text style={styles.itemSubtotal}>
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </Text>
                  <View style={styles.qtyRow}>
                    {updatingId === item.id ? (
                      <ActivityIndicator color="#e91e8c" size="small" />
                    ) : (
                      <>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity - 1)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.quantity + 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {cart!.total.toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, checkoutLoading && styles.checkoutBtnDisabled]}
              onPress={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.checkoutBtnText}>Fazer Pedido ♡</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff0f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#f48fb1', marginTop: 12, fontSize: 14, fontStyle: 'italic' },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#fce4ec' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#c2185b' },
  headerSub: { fontSize: 13, color: '#f48fb1', fontStyle: 'italic', marginTop: 2 },
  errorBox: { backgroundColor: '#fce4ec', margin: 16, borderRadius: 12, padding: 12 },
  errorText: { color: '#c2185b', fontSize: 13, textAlign: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#c2185b' },
  emptySub: { fontSize: 13, color: '#f48fb1', textAlign: 'center', marginTop: 6 },
  successEmoji: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#c2185b', marginBottom: 6 },
  successSub: { fontSize: 14, color: '#f48fb1', textAlign: 'center', fontStyle: 'italic' },
  backBtn: { marginTop: 24, backgroundColor: '#e91e8c', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 16 },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#fce4ec', elevation: 2,
  },
  itemImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12, backgroundColor: '#fce4ec' },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#2d1b2e', marginBottom: 4 },
  itemUnit: { fontSize: 12, color: '#aaa' },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemSubtotal: { fontSize: 15, fontWeight: '800', color: '#e91e8c' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fce4ec', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: '#c2185b', fontWeight: '700', lineHeight: 22 },
  qtyNum: { fontSize: 16, fontWeight: '700', color: '#2d1b2e', minWidth: 20, textAlign: 'center' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#fce4ec',
    shadowColor: '#e91e8c', shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#ad1457' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#c2185b' },
  checkoutBtn: { backgroundColor: '#e91e8c', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#e91e8c', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});