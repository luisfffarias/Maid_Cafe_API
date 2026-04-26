import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyRole, Role } from '../../services/api';

export default function TabsLayout() {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => { getMyRole().then(setRole); }, []);

  const isUser = role === 'USER';
  const isStaff = role === 'ADMIN' || role === 'MAID';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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