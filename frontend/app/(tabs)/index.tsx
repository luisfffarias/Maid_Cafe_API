import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Image, Platform
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getToken, logout, addToCart } from '../../services/api'; 

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description: string; price: number;
  imageUrl: string | null; stock: number; isAvailable: boolean;
  categoryId: string; category: Category;
}

const API_URL = 'https://maid-cafe-api.onrender.com';

const ProductCard = ({ item, onAdd }: { item: Product; onAdd: (product: Product) => void }) => {
  const [adding, setAdding] = useState(false);
  const isOutOfStock = !item.isAvailable || item.stock <= 0;

  const getEmoji = (categoryName: string) => {
    if (categoryName === 'Bebidas') return '🧋';
    if (categoryName === 'Sobremesas') return '🍰';
    return '🐾';
  };

  async function handlePress() {
    setAdding(true);
    try { await onAdd(item); } finally { setAdding(false); }
  }

  return (
    <View style={[styles.productCard, isOutOfStock && styles.productCardDisabled]}>
      <View style={styles.imagePlaceholder}>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          : <Text style={{ fontSize: 35 }}>{getEmoji(item.category?.name || '')}</Text>
        }
      </View>
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.productCategory}>{item.category?.name || 'Delícia'}</Text>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        </View>
        
        <View>
          <Text style={styles.productPrice}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
          </Text>
          {item.stock > 0 && item.isAvailable && (
            <Text style={styles.stockText}>Restam: {item.stock}</Text>
          )}
          <TouchableOpacity
            style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
            onPress={handlePress}
            disabled={isOutOfStock || adding}
          >
            {adding
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.addButtonText}>{isOutOfStock ? 'Esgotado' : '+ Adicionar'}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function MenuScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  async function loadMenu() {
    try {
      const token = await getToken();
      if (!token) { router.replace('/(auth)/login'); return; }

      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) { await logout(); router.replace('/(auth)/login'); return; }
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
        const uniqueCategories = Array.from(
          new Map(data.map((item: Product) => [item.category.id, item.category])).values()
        ) as Category[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar o cardápio:', error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { loadMenu(); }, []));

  async function handleAddToCart(product: Product) {
    try {
      await addToCart(product.id, 1, 1);
      setFeedback(`"${product.name}" adicionado ao carrinho! 🛒`);
      setTimeout(() => setFeedback(''), 2500);
    } catch (error: any) {
      setFeedback(error.message || 'Não conseguimos adicionar o pedido.');
      setTimeout(() => setFeedback(''), 3000);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(product => {
      const matchCategory = !selectedCategory || product.categoryId === selectedCategory;
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={{ marginTop: 10, color: '#FF69B4', fontWeight: 'bold' }}>Preparando o Menu Mágico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maid Café Menu 🐾</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Procurar uma delícia..."
          placeholderTextColor="#FFB6C1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {feedback ? (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={{ height: 60, marginTop: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          <TouchableOpacity
            style={[styles.categoryBtn, !selectedCategory && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>Tudo</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddToCart} />}
        numColumns={Platform.OS === 'web' ? undefined : 2}
        key={Platform.OS === 'web' ? 'h' : 'v'}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma delícia encontrada 😿</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF69B4', textAlign: 'center', marginBottom: 15 },
  searchBar: { width: '100%', maxWidth: 500, backgroundColor: '#FFF5F7', borderRadius: 15, padding: 12, color: '#8B5A2B', borderWidth: 1, borderColor: '#FFC0CB' },
  categoryList: { paddingHorizontal: 20, alignItems: 'center', gap: 10 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FFC0CB' },
  categoryBtnActive: { backgroundColor: '#FF69B4', borderColor: '#FF69B4' },
  categoryText: { color: '#FF69B4', fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  
  listContainer: { 
    padding: 10,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: Platform.OS === 'web' ? 'wrap' : 'nowrap',
    justifyContent: 'flex-start' // <--- AQUI ESTÁ A MUDANÇA (era 'center')
  },

  emptyText: { textAlign: 'center', color: '#8B5A2B', marginTop: 40, fontSize: 16, fontWeight: '600' },
  feedbackBar: { backgroundColor: '#FF69B4', paddingVertical: 10, paddingHorizontal: 20 },
  feedbackText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 13 },

  productCard: { 
    backgroundColor: '#FFF', 
    margin: 6, 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 3, 
    shadowColor: '#FFB6C1', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4,
    flex: Platform.OS === 'web' ? 0 : 1,
    minWidth: Platform.OS === 'web' ? 250 : '45%',
    maxWidth: Platform.OS === 'web' ? 280 : '50%',
    minHeight: 320 // Mantém o tamanho mínimo para padronizar
  },

  productCardDisabled: { opacity: 0.5 },
  imagePlaceholder: { width: '100%', height: 120, backgroundColor: '#FFF5F7', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  infoContainer: { padding: 12, flex: 1, justifyContent: 'space-between' },
  productCategory: { fontSize: 10, color: '#FF69B4', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  productName: { color: '#8B5A2B', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  productDesc: { color: '#A0522D', fontSize: 11, marginBottom: 8, opacity: 0.8 },
  productPrice: { color: '#FF69B4', fontWeight: '800', fontSize: 16 },
  stockText: { fontSize: 10, color: '#aaa', marginBottom: 4 },
  addButton: { backgroundColor: '#FF69B4', paddingVertical: 10, borderRadius: 12, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  addButtonDisabled: { backgroundColor: '#D3D3D3' },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});