const BASE_URL = 'https://maid-cafe-api.onrender.com';
import AsyncStorage from '@react-native-async-storage/async-storage';
  
export type Role = 'USER' | 'MAID' | 'ADMIN';
 
export interface LoginResponse {
  access_token: string;
}
 
export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
 
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
 
  const data = await res.json();
 
  if (!res.ok) {
    throw new Error(data.message || 'Erro ao fazer login.');
  }
 
  await AsyncStorage.setItem('access_token', data.access_token);
  return data;
}
 
export async function register(
  name: string,
  email: string,
  password: string,
  role: Role = 'USER'
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
 
  const data = await res.json();
 
  if (!res.ok) {
    throw new Error(data.message || 'Erro ao cadastrar.');
  }
 
  return data;
}
 
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('access_token');
}
 
export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('access_token');
}
export async function addToCart(productId: string, quantity: number = 1, tableNumber: number = 1) {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Agora enviamos o pacote completo que o AddItemDto exige!
  const payload = { 
    productId, 
    quantity, 
    tableNumber // 👈 Adicionámos o número da mesa
  };
  
  console.log("📦 A enviar para a API:", payload);

  const res = await fetch(`${BASE_URL}/orders/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload), 
  });

  const data = await res.json();

  if (!res.ok) {
    const errorDetails = Array.isArray(data.message) 
      ? data.message.join('\n') 
      : data.message;
      
    throw new Error(errorDetails || 'Erro ao adicionar ao carrinho.');
  }

  return data;
}