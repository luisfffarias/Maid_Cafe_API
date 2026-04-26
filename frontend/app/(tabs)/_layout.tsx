import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getToken, logout } from '../../services/api';
import { ActivityIndicator, View } from 'react-native';

// Função auxiliar simples para decodificar a Role do JWT sem bibliotecas externas
function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role; // Certifique-se que o campo no JWT do NestJS se chama 'role'
  } catch (e) {
    return null;
  }
}

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const token = await getToken();
      if (token) {
        const userRole = getRoleFromToken(token);
        setRole(userRole);
      }
      setLoading(false);
    }
    checkAccess();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' }}>
        <ActivityIndicator color="#FF69B4" size="large" />
      </View>
    );
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#FF69B4',
      tabBarInactiveTintColor: '#8B5A2B',
      tabBarStyle: {
        backgroundColor: '#FFF0F5',
        borderTopColor: '#FFC0CB',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
      },
      headerStyle: {
        backgroundColor: '#FFF0F5',
      },
      headerTitleStyle: {
        color: '#FF69B4',
        fontWeight: 'bold',
      },
      headerShadowVisible: false,
    }}>
      
      {/* Aba do Cardápio - Visível para todos */}
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Cardápio',
          tabBarIcon: ({ color }) => <FontAwesome name="coffee" size={24} color={color} />,
        }} 
      />

      {/* Aba de Estoque - Condicional para Maid e Admin */}
      {(role === 'MAID' || role === 'ADMIN') && (
        <Tabs.Screen 
          name="inventory" 
          options={{
            title: 'Estoque',
            tabBarIcon: ({ color }) => <FontAwesome name="archive" size={24} color={color} />,
          }} 
        />
      )}

      {/* Aba de Perfil - Visível para todos */}
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
        }} 
      />
      
    </Tabs>
  );
}