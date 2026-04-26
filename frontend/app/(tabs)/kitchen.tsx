import { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { getOrderQueue, updateOrderStatus, Order, OrderStatus } from '../../services/api';

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, next: OrderStatus | null, actionLabel: string }> = {
  OPEN: { label: 'No Carrinho', color: '#9e9e9e', next: null, actionLabel: '' }, 
  PENDING: { label: 'Aguardando', color: '#ff9800', next: 'PREPARING', actionLabel: '👨‍🍳 Iniciar Preparo' },
  PREPARING: { label: 'Preparando', color: '#2196f3', next: 'DELIVERED', actionLabel: '🐾 Entregar na Mesa' },
  DELIVERED: { label: 'Entregue', color: '#4caf50', next: null, actionLabel: '' },
  CANCELED: { label: 'Cancelado', color: '#f44336', next: null, actionLabel: '' },
};

export default function KitchenScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchQueue() {
    try {
      const data = await getOrderQueue();
      const activeOrders = data.filter(o => 
        o.status === 'PENDING' || o.status === 'PREPARING'
      );
      setOrders(activeOrders);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchQueue(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchQueue(); };

  async function handleAdvanceStatus(order: Order) {
    const config = STATUS_CONFIG[order.status];
    if (!config.next) return;

    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, config.next);
      if (config.next === 'DELIVERED') {
        setOrders(prev => prev.filter(o => o.id !== order.id));
        Alert.alert('Sucesso! ✨', `Pedido de ${(order as any).user?.email || 'cliente'} entregue!`);
      } else {
        setOrders(prev => 
          prev.map(o => o.id === order.id ? { ...o, status: config.next! } : o)
        );
      }
    } catch (error: any) {
      Alert.alert('Erro ao atualizar', error.message);
      fetchQueue(); 
    } finally {
      setUpdatingId(null);
    }
  }

  const renderOrderItem = ({ item }: { item: Order }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG['PENDING'];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userEmail}>{(item as any).user?.email || 'cliente'}</Text>
            <Text style={styles.tableText}>Mesa {item.tableNumber}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.itemsContainer}>
          {item.items && item.items.length > 0 ? (
            item.items.map((orderItem, index) => (
              <Text key={index} style={styles.itemText}>
                • {orderItem.quantity}x {orderItem.product?.name || 'Item Desconhecido'}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyItemsText}>Nenhum item listado.</Text>
          )}
        </View>

        {config.next && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: config.color }]}
            onPress={() => handleAdvanceStatus(item)}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>{config.actionLabel}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#FF69B4" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 Cozinha</Text>
        <Text style={styles.headerSub}>Fila de Preparação</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF69B4" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>A cozinha está calma. Nenhum pedido na fila!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  header: { backgroundColor: '#fff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#FFC0CB' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FF69B4' },
  headerSub: { fontSize: 13, color: '#8B5A2B', fontStyle: 'italic', marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFC0CB', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FFF0F5', paddingBottom: 8 },
  userEmail: { fontSize: 13, fontWeight: '700', color: '#FF69B4' },
  tableText: { fontSize: 12, color: '#8B5A2B', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  itemsContainer: { marginBottom: 16 },
  itemText: { fontSize: 15, color: '#5D4037', marginBottom: 4, fontWeight: '500' },
  emptyItemsText: { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 1 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#8B5A2B', fontWeight: 'bold', textAlign: 'center' },
});