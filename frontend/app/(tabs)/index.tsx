import { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, Image, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { getToken, logout, addToCart } from '../../services/api'; 

// --- Tipagens ---
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
  categoryId: string;
  category: Category;
}

const API_URL = 'https://maid-cafe-api.onrender.com';

// --- Fábrica de Cards de Produto ---
const ProductCardFactory = ({ item }: { item: Product }) => {
  const [adding, setAdding] = useState(false);

  // Nova regra: Esgotado se a flag isAvailable for falsa OU o estoque for zero/menor que zero
  const isOutOfStock = !item.isAvailable || item.stock <= 0;

  const getEmoji = (categoryName: string) => {
    if (categoryName === 'Bebidas') return '🧋';
    if (categoryName === 'Sobremesas') return '🍰';
    return '🐾';
  };

  async function handleAddToCart() {
    setAdding(true);
    try {
      // Chama a API passando o ID do produto e a quantidade (1)
      await addToCart(item.id, 1);
      Alert.alert('Sucesso! 🌸', `1x ${item.name} foi adicionado à sua mesa!`);
    } catch (error: any) {
      Alert.alert('Ops! 😿', error.message || 'Não conseguimos adicionar o pedido.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={[styles.productCard, isOutOfStock && styles.productCardDisabled]}>
      <View style={styles.imagePlaceholder}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 35 }}>{getEmoji(item.category?.name || '')}</Text>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.productCategory}>{item.category?.name || 'Delícia'}</Text>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.productPrice}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
        </Text>

        {/* Botão de Adicionar ao Carrinho à prova de falhas de estoque */}
        <TouchableOpacity 
          style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]} 
          onPress={handleAddToCart}
          disabled={isOutOfStock || adding}
        >
          {adding ? (
             <ActivityIndicator color="#FFF" size="small" />
          ) : (
             <Text style={styles.addButtonText}>
               {isOutOfStock ? 'Esgotado' : '+ Adicionar'}
             </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Tela Principal do Cardápio ---
export default function MenuScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const token = await getToken();

        if (!token) {
          router.replace('/(auth)/login');
          return;
        }

        const response = await fetch(`${API_URL}/products`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        if (response.status === 401) {
          await logout(); 
          router.replace('/(auth)/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setProducts(data);
          const uniqueCategories = Array.from(
            new Map(data.map(item => [item.category.id, item.category])).values()
          );
          setCategories(uniqueCategories);
        }
        
      } catch (error) {
        console.error('Erro ao carregar o cardápio:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMenu();
  }, []);

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
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCardFactory item={item} />}
        numColumns={Dimensions.get('window').width > 600 ? 3 : 2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma delícia encontrada 😿</Text>
        }
      />
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF69B4', textAlign: 'center', marginBottom: 15 },
  searchBar: { backgroundColor: '#FFF5F7', borderRadius: 15, padding: 12, color: '#8B5A2B', borderWidth: 1, borderColor: '#FFC0CB' },
  categoryList: { paddingHorizontal: 20, alignItems: 'center', gap: 10 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FFC0CB' },
  categoryBtnActive: { backgroundColor: '#FF69B4', borderColor: '#FF69B4' },
  categoryText: { color: '#FF69B4', fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  listContainer: { padding: 10 },
  emptyText: { textAlign: 'center', color: '#8B5A2B', marginTop: 40, fontSize: 16, fontWeight: '600' },
  
  productCard: { flex: 1, backgroundColor: '#FFF', margin: 8, borderRadius: 20, overflow: 'hidden', elevation: 3, shadowColor: '#FFB6C1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  productCardDisabled: { opacity: 0.5 }, 
  imagePlaceholder: { width: '100%', height: 120, backgroundColor: '#FFF5F7', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  infoContainer: { padding: 12, flex: 1, justifyContent: 'space-between' },
  productCategory: { fontSize: 10, color: '#FF69B4', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  productName: { color: '#8B5A2B', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  productDesc: { color: '#A0522D', fontSize: 11, marginBottom: 8, opacity: 0.8 },
  productPrice: { color: '#FF69B4', fontWeight: '800', fontSize: 16 },
  
  addButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D3D3D3', 
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});