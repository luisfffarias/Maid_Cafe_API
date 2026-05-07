import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  TextInput, ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { logout, getToken, decodeToken, updateUserName, Order, getUserHistory, cancelMyOrder } from '../../services/api';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando', PREPARING: 'Preparando',
  DELIVERED: 'Entregue', CANCELED: 'Cancelado', OPEN: 'Aberto',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#ff9800', PREPARING: '#2196f3',
  DELIVERED: '#4caf50', CANCELED: '#f44336', OPEN: '#9e9e9e',
};

// Dicionário para deixar a exibição da Maid mais fofa
const MAID_LABELS: Record<string, string> = {
  DEREDERE: '🌸 Deredere',
  TSUNDERE: '😾 Tsundere',
  DANDERE: '🥺 Dandere',
  ONEESAN: '☕ Oneesan',
  KUUDERE: '🧊 Kuudere',
};

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  async function loadProfile() {
    const token = await getToken();
    if (!token) return;
    
    const decoded = decodeToken(token);
    if (decoded) {
      setRole(decoded.role);
      setUserId(decoded.sub);
    }
    
    const savedName = await AsyncStorage.getItem('user_name');
    const savedPhoto = await AsyncStorage.getItem('user_photo');
    
    if (savedName) setName(savedName);
    if (savedPhoto) setPhoto(savedPhoto);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await getUserHistory();
      // Ordena para mostrar os mais recentes primeiro
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sortedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  }

  useFocusEffect(useCallback(() => {
    loadProfile();
    loadOrders();
  }, []));

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateUserName(userId, nameInput.trim());
      await AsyncStorage.setItem('user_name', nameInput.trim());
      setName(nameInput.trim());
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      await AsyncStorage.setItem('user_photo', uri);
    }
  }

  async function executeLogout() {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) { console.error(e); }
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja sair, Mestre?')) executeLogout();
    } else {
      Alert.alert('Sair do Café', 'Tem certeza que deseja ir embora, Mestre?', [
        { text: 'Ficar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: executeLogout },
      ]);
    }
  }

  // --- Função para Cancelar o Pedido ---
  function handleCancelOrder(orderId: string) {
    Alert.alert('Cancelar Pedido', 'Deseja mesmo cancelar este pedido?', [
      { text: 'Não', style: 'cancel' },
      { 
        text: 'Sim, Cancelar', 
        style: 'destructive', 
        onPress: async () => {
          setCancelingId(orderId);
          try {
            await cancelMyOrder(orderId);
            await loadOrders(); // Recarrega a lista para atualizar o status
            Alert.alert('Cancelado', 'O seu pedido foi cancelado com sucesso.');
          } catch (e: any) {
            Alert.alert('Erro ao cancelar', e.message);
          } finally {
            setCancelingId(null);
          }
        }
      },
    ]);
  }

  const ROLE_LABEL: Record<string, string> = { USER: 'Cliente', MAID: 'Maid', ADMIN: 'Admin' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrapper}>
        {photo
          ? <Image source={{ uri: photo }} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}><Text style={styles.avatarEmoji}>👤</Text></View>
        }
        <View style={styles.avatarEdit}><Text style={styles.avatarEditText}>📷</Text></View>
      </TouchableOpacity>

      {editingName ? (
        <View style={styles.nameEditRow}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Seu nome"
            placeholderTextColor="#f9a8c9"
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} disabled={savingName}>
            {savingName
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Salvar</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingName(false)}>
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setNameInput(name); setEditingName(true); }}>
          <Text style={styles.name}>{name || 'Toque para definir seu nome'} ✏️</Text>
        </TouchableOpacity>
      )}

      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{ROLE_LABEL[role] || role}</Text>
      </View>

      <Text style={styles.sectionTitle}>📋 Histórico de Pedidos</Text>

      {loadingOrders ? (
        <ActivityIndicator color="#e91e8c" style={{ marginTop: 16 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyText}>Nenhum pedido ainda.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderTable}>Mesa {order.tableNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[order.status] || '#aaa') + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] || '#aaa' }]}>
                  {STATUS_LABEL[order.status] || order.status}
                </Text>
              </View>
            </View>

            {/* Exibição da Personalidade da Maid */}
            {order.maidType && (
              <View style={styles.maidInfoBadge}>
                <Text style={styles.maidInfoText}>
                  Atendimento: {MAID_LABELS[order.maidType] || order.maidType}
                </Text>
              </View>
            )}

            <View style={styles.itemsDivider} />

            {order.items?.map((item) => (
              <Text key={item.id} style={styles.orderItem}>
                • {item.quantity}x {item.product?.name}
              </Text>
            ))}
            
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>
                Total: R$ {order.total.toFixed(2).replace('.', ',')}
              </Text>

              {/* Botão de Cancelar - Só aparece se estiver PENDING */}
              {order.status === 'PENDING' && (
                <TouchableOpacity 
                  style={styles.cancelOrderBtn} 
                  onPress={() => handleCancelOrder(order.id)}
                  disabled={cancelingId === order.id}
                >
                  {cancelingId === order.id ? (
                    <ActivityIndicator color="#f44336" size="small" />
                  ) : (
                    <Text style={styles.cancelOrderBtnText}>Cancelar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {/* Botão de Sair adicionado de volta à interface */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair do Café</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  content: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  avatarWrapper: { marginBottom: 16, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#FF69B4' },
  avatarPlaceholder: { width: 100, height: 100, backgroundColor: '#FFC0CB', borderRadius: 50, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  avatarEmoji: { fontSize: 40 },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#e91e8c', borderRadius: 12, padding: 4 },
  avatarEditText: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', color: '#FF69B4', marginBottom: 8, textAlign: 'center' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, width: '100%' },
  nameInput: { flex: 1, borderWidth: 1.5, borderColor: '#f8bbd0', borderRadius: 10, padding: 10, fontSize: 15, color: '#333', backgroundColor: '#fff9fb' },
  saveBtn: { backgroundColor: '#e91e8c', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { backgroundColor: '#fce4ec', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  cancelBtnText: { color: '#c2185b', fontWeight: '700' },
  roleBadge: { backgroundColor: '#fce4ec', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 32 },
  roleText: { color: '#c2185b', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#c2185b', alignSelf: 'flex-start', marginBottom: 12 },
  emptyOrders: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#f48fb1', fontSize: 14 },
  
  orderCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#fce4ec', elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderTable: { fontSize: 16, fontWeight: '800', color: '#8B5A2B' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  
  maidInfoBadge: { backgroundColor: '#fff0f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  maidInfoText: { color: '#c2185b', fontSize: 12, fontWeight: '600' },
  itemsDivider: { height: 1, backgroundColor: '#fce4ec', marginVertical: 8 },
  
  orderItem: { fontSize: 13, color: '#5D4037', marginBottom: 3 },
  
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  orderTotal: { fontSize: 15, fontWeight: '900', color: '#e91e8c' },
  cancelOrderBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#f44336' },
  cancelOrderBtnText: { color: '#f44336', fontSize: 12, fontWeight: 'bold' },
  
  logoutButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FF69B4', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, width: '100%', alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
});