import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform } from 'react-native';
// 👇 Não se esqueça de importar o getUserHistory e o cancelMyOrder
import { getMyRole, Role, logout, getUserHistory, cancelMyOrder } from '../../services/api';

export default function TabsLayout() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => { 
    getMyRole().then(setRole); 
  }, []);

  const handleLogout = () => {
  const executeLogout = async () => {
    try {
      if (role === 'USER') {
        // Faz a verificação dupla e limpeza no servidor
        await logoutCleanup(); 
      }
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Erro ao sair:', e);
      // Mesmo com erro, fazemos o logout local por segurança
      await logout();
      router.replace('/(auth)/login');
    }
  };

  if (Platform.OS === 'web') {
    if (window.confirm('Deseja encerrar sua visita e liberar a mesa?')) executeLogout();
  } else {
    Alert.alert('Finalizar Visita', 'Deseja encerrar sua sessão? A mesa será liberada.', [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Finalizar e Sair', style: 'destructive', onPress: executeLogout },
    ]);
  }
};

  const isUser = role === 'USER';
  const isStaff = role === 'ADMIN' || role === 'MAID';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTintColor: '#e91e8c', // Cor do título e ícones
        // A LINHA ABAIXO DEFINE A COR DE FUNDO DO CABEÇALHO:
        headerStyle: {
          backgroundColor: '#fff', // Cor branca para combinar com as Tabs
          borderBottomWidth: 1,
          borderBottomColor: '#fce4ec',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#e91e8c" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: '#e91e8c',
        tabBarInactiveTintColor: '#f48fb1',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#fce4ec',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cardápio',
          href: isUser ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cafe-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          href: isUser ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Cozinha',
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Estoque',
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: role === 'ADMIN' ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          href: isUser ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}