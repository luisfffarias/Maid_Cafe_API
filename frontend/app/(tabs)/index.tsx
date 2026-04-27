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

const ProductCard = ({ item, onAdd, cardWidth }: { item: Product; onAdd: (product: Product) => void; cardWidth: number }) => {
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
    <View style={[styles.productCard, isOutOfStock && styles.productCardDisabled, { width: cardWidth }]}>
      <View style={styles.imagePlaceholder}>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          : <Text style={{ fontSize: 45 }}>{getEmoji(item.category?.name || '')}</Text>
        }
        {/* Etiqueta fofa flutuante para o preço */}
        <View style={styles.priceTag}>
          <Text style={styles.productPrice}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.productCategory}>✦ {item.category?.name || 'Delícia'} ✦</Text>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        
        {item.stock > 0 && item.isAvailable && (
          <Text style={styles.stockText}>🎀 Restam apenas: {item.stock}</Text>
        )}
        
        <TouchableOpacity
          style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
          onPress={handlePress}
          disabled={isOutOfStock || adding}
          activeOpacity={0.7}
        >
          {adding
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={styles.addButtonText}>
                {isOutOfStock ? 'Fugiu! 😿' : 'Eu Quero! ♡'}
              </Text>
          }
        </TouchableOpacity>
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
      await addToCart(product.id, 1);
      setFeedback(`Yatta! "${product.name}" na sua mesa! 🪄✨`);
      setTimeout(() => setFeedback(''), 2500);
    } catch (error: any) {
      setFeedback(error.message || 'Ops! Magia falhou, tente de novo. 💦');
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

  // Cálculos dinâmicos para a largura do cartão baseada na tela do dispositivo
  const windowWidth = Dimensions.get('window').width;
  const numColumns = windowWidth > 600 ? 3 : 2;
  const cardWidth = (windowWidth - 20) / numColumns - 16;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingKaomoji}>(=^･ω･^=)🐾</Text>
        <ActivityIndicator size="large" color="#FF69B4" style={{ marginVertical: 15 }} />
        <Text style={styles.loadingText}>Preparando a magia do menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎀 MaidInBrasil 🎀</Text>
        <Text style={styles.subtitle}>Qual o seu pedido?</Text>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBar}
            placeholder="Procurar uma delícia..."
            placeholderTextColor="#FFB6C1"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Ondinhas/Rendinhas imitando o final do cabeçalho */}
      <View style={styles.laceBorderContainer}>
         <Text style={styles.laceText}>︶ ིི ྀ⏝ ིི ྀ︶ ིི ྀ⏝ ིི ྀ︶ ིི ྀ⏝ ིི ྀ︶ ིི ྀ⏝ ིི ྀ︶</Text>
      </View>

      {feedback ? (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={{ height: 60, marginTop: 5 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          <TouchableOpacity
            style={[styles.categoryBtn, !selectedCategory && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>Tudo ✨</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={numColumns} // Força a recarga do layout se a tela girar
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} onAdd={handleAddToCart} cardWidth={cardWidth} />}
        numColumns={numColumns}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyKaomoji}>(╥﹏╥)</Text>
            <Text style={styles.emptyText}>Nenhuma delícia encontrada...</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  loadingKaomoji: { fontSize: 30, color: '#FF69B4', marginBottom: 10 },
  loadingText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
  
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFFFFF', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FF69B4', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8B5A2B', fontStyle: 'italic', marginTop: 4, marginBottom: 15 },
  
  laceBorderContainer: { alignItems: 'center', backgroundColor: '#FFF0F5', marginTop: -12, zIndex: -1 },
  laceText: { color: '#FFFFFF', fontSize: 20, letterSpacing: -2 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F7', borderRadius: 25, borderWidth: 2, borderColor: '#FFE4E1', paddingHorizontal: 15, width: '100%' },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 12, color: '#8B5A2B', fontSize: 16 },
  
  categoryList: { paddingHorizontal: 20, alignItems: 'center', gap: 12 },
  categoryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFE4E1', borderStyle: 'dashed' },
  categoryBtnActive: { backgroundColor: '#FFB6C1', borderColor: '#FF69B4', borderStyle: 'solid' },
  categoryText: { color: '#FF69B4', fontWeight: '800', fontSize: 14 },
  categoryTextActive: { color: '#FFFFFF' },
  
  listContainer: { padding: 10, paddingBottom: 30 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyKaomoji: { fontSize: 40, color: '#FFB6C1', marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#8B5A2B', fontSize: 16, fontWeight: '600' },
  
  feedbackBar: { backgroundColor: '#FF69B4', paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 20, borderRadius: 20, marginTop: 10, elevation: 4 },
  feedbackText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  
  // Cartão do Produto (sem o flex: 1 para respeitar a largura matemática)
  productCard: { backgroundColor: '#FFF', margin: 8, borderRadius: 25, borderWidth: 3, borderColor: '#FFF0F5', overflow: 'hidden', elevation: 2 },
  productCardDisabled: { opacity: 0.6, backgroundColor: '#F8F8FF' },
  
  imagePlaceholder: { width: '100%', height: 130, backgroundColor: '#FFE4E1', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#FFF0F5', borderStyle: 'dashed' },
  image: { width: '100%', height: '100%' },
  
  priceTag: { position: 'absolute', bottom: -15, right: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 2, borderColor: '#FFB6C1', elevation: 3 },
  productPrice: { color: '#FF69B4', fontWeight: '900', fontSize: 15 },
  
  infoContainer: { padding: 15, paddingTop: 20, flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  productCategory: { fontSize: 10, color: '#FFB6C1', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  productName: { color: '#8B5A2B', fontWeight: 'bold', fontSize: 16, marginBottom: 4, textAlign: 'center' },
  productDesc: { color: '#D2B48C', fontSize: 12, marginBottom: 10, textAlign: 'center', lineHeight: 16 },
  stockText: { fontSize: 11, color: '#FF69B4', fontWeight: '600', marginBottom: 8, backgroundColor: '#FFF5F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  
  addButton: { backgroundColor: '#FF69B4', paddingVertical: 12, width: '100%', borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF69B4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
  addButtonDisabled: { backgroundColor: '#E6E6FA', shadowOpacity: 0 },
  addButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});