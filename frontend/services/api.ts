const BASE_URL = 'https://maid-cafe-api.onrender.com';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'USER' | 'MAID' | 'ADMIN';

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

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

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    imageUrl: string;
  };
}

export interface Order {
  id: string;
  tableNumber: number;
  status: string;
  total: number;
  items: OrderItem[];
}

// Helper de Autenticação
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Funções de Auth
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao fazer login.');

  await AsyncStorage.setItem('access_token', data.access_token);
  return data;
}

export async function register(name: string, email: string, password: string, role: Role = 'USER'): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar.');
  return data;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('access_token');
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('access_token');
}

// Funções de Carrinho e Pedidos
export async function addToCart(productId: string, quantity: number = 1, tableNumber: number = 1) {
  const res = await fetch(`${BASE_URL}/orders/cart`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ productId, quantity, tableNumber }), 
  });

  const data = await res.json();
  if (!res.ok) {
    const errorDetails = Array.isArray(data.message) ? data.message.join('\n') : data.message;
    throw new Error(errorDetails || 'Erro ao adicionar ao carrinho.');
  }
  return data;
}

export async function getCart(): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/cart`, {
    method: 'GET',
    headers: await authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao buscar o carrinho.');
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/cart/item/${itemId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao atualizar quantidade.');
  return data;
}

export async function removeCartItem(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/cart/item/${itemId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao remover item.');
  }
}

export async function checkout(): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/checkout`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao finalizar pedido.');
  }
}

// Outras funções de Produto/Admin
export async function updateProductStock(productId: string, stock: number) {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ stock: stock, isAvailable: stock > 0 }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao atualizar o estoque.');
  }
  return res.json();
}

export async function createCategory(name: string) {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao criar categoria.');
  }
  return res.json();
}

export async function createProduct(productData: any) {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erro ao criar produto.');
  }
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${BASE_URL}/categories`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar categorias.');
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${BASE_URL}/products`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Erro ao buscar produtos.');
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao buscar usuários.');
  return data;
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${id}`, { 
    method: 'PATCH', 
    headers: await authHeaders(), 
    body: JSON.stringify({ role }) 
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao atualizar usuário.');
  return data;
}

// --- GESTÃO DE PEDIDOS (COZINHA) ---

// Tipagens (Ajuste se o backend enviar propriedades com nomes ligeiramente diferentes)
export type OrderStatus = 'OPEN' | 'PENDING' | 'PREPARING' | 'DELIVERED' | 'CANCELED';

export interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[]; // Assumindo que a API traz os itens do pedido juntos
}

// 1. Buscar a Fila da Cozinha
export async function getOrderQueue(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/orders/queue`, { 
    method: 'GET',
    headers: await authHeaders() 
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao buscar fila da cozinha.');
  return data;
}

// 2. Atualizar o Status do Pedido
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, { 
    method: 'PATCH', 
    headers: await authHeaders(), 
    body: JSON.stringify({ status }) 
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro ao atualizar pedido.');
  return data;
}