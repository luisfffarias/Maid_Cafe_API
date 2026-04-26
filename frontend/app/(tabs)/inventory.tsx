import { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Image 
} from 'react-native';
import { getToken, updateProductStock, createCategory, createProduct, getCategories, getProducts } from '../../services/api';

const API_URL = 'https://maid-cafe-api.onrender.com';

function getRoleFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role;
  } catch (e) { return null; }
}

// --- Sub-componente de Atualização de Estoque ---
const StockItem = ({ product, onUpdate }: { product: any, onUpdate: () => void }) => {
  const [stock, setStock] = useState(product.stock || 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProductStock(product.id, stock);
      Alert.alert('Sucesso', 'Estoque atualizado! 🌸');
      onUpdate(); 
    } catch (error: any) { Alert.alert('Erro', error.message); }
    finally { setSaving(false); }
  }

  return (
    <View style={styles.stockCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category?.name}</Text>
      </View>
      <View style={styles.counterContainer}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setStock(Math.max(0, stock - 1))}>
          <Text style={styles.counterText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stockNumber}>{stock}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setStock(stock + 1)}>
          <Text style={styles.counterText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.saveBtn, stock === product.stock && styles.saveBtnDisabled]} 
        onPress={handleSave}
        disabled={stock === product.stock || saving}
      >
        {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
      </TouchableOpacity>
    </View>
  );
};

// --- Tela Principal ---
export default function InventoryScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário Admin (SEM ESTOQUE INICIAL)
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  
  const [newCatName, setNewCatName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      setRole(getRoleFromToken(token));

      const [prodData, catData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateProduct() {
    if (!newProdName || !newProdPrice || !newProdCatId) {
      Alert.alert('Aviso', 'Preencha os campos obrigatórios (Nome, Preço e Categoria).');
      return;
    }

    try {
      await createProduct({
        name: newProdName,
        description: newProdDesc || 'Sem descrição.',
        price: parseFloat(newProdPrice.replace(',', '.')),
        imageUrl: newProdImage,
        categoryId: newProdCatId
      });
      Alert.alert('Sucesso', 'Nova delícia adicionada ao menu! ✨\nLembre-se de atualizar o estoque!');
      
      // Limpar campos
      setNewProdName(''); setNewProdDesc(''); setNewProdPrice('');
      setNewProdImage(''); setNewProdCatId('');
      
      loadData(); // Recarrega a lista para mostrar o produto recém-criado
    } catch (error: any) { Alert.alert('Erro', error.message); }
  }

  async function handleCreateCategory() {
    if (!newCatName) return;
    try {
      await createCategory(newCatName);
      Alert.alert('Sucesso', 'Categoria criada!');
      setNewCatName(''); loadData();
    } catch (error: any) { Alert.alert('Erro', error.message); }
  }

  const selectedCategoryName = categories.find(c => c.id === newProdCatId)?.name;

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#FF69B4" size="large" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.pageTitle}>Gestão de Estoque 📦</Text>
      <Text style={styles.pageSubtitle}>Logado como: {role === 'ADMIN' ? '👑 Administrador' : '🎀 Maid'}</Text>

      {/* SECÇÃO 1: Atualização de Estoque */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atualizar Disponibilidade</Text>
        {products.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#8B5A2B', marginTop: 10 }}>Nenhum produto cadastrado ainda.</Text>
        ) : (
          products.map(p => <StockItem key={p.id} product={p} onUpdate={loadData} />)
        )}
      </View>

      {/* SECÇÃO 2: Painel Administrativo */}
      {role === 'ADMIN' && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>👑 Administração do Menu</Text>
          
          {/* Criar Categoria */}
          <View style={styles.adminCard}>
            <Text style={styles.label}>Nova Categoria</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Ex: Bebidas" value={newCatName} onChangeText={setNewCatName} />
              <TouchableOpacity style={styles.actionBtn} onPress={handleCreateCategory}><Text style={styles.actionBtnText}>Criar</Text></TouchableOpacity>
            </View>
          </View>

          {/* Criar Produto Completo (Sem Estoque) */}
          <View style={styles.adminCard}>
            <Text style={styles.label}>Novo Produto *</Text>
            <TextInput style={styles.input} placeholder="Nome do Produto" value={newProdName} onChangeText={setNewProdName} />
            
            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Ex: Omelete fofinho..." multiline value={newProdDesc} onChangeText={setNewProdDesc} />
            
            <Text style={styles.label}>Preço (R$) *</Text>
            <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={newProdPrice} onChangeText={setNewProdPrice} />

            <Text style={styles.label}>URL da Imagem</Text>
            <TextInput style={styles.input} placeholder="https://exemplo.com/imagem.png" value={newProdImage} onChangeText={setNewProdImage} />
            {newProdImage ? <Image source={{ uri: newProdImage }} style={styles.previewImage} /> : null}

            <Text style={styles.label}>Categoria *</Text>
            <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Text style={{ color: selectedCategoryName ? '#5D4037' : '#aaa' }}>{selectedCategoryName || 'Escolha uma categoria...'}</Text>
              <Text style={{ color: '#FF69B4' }}>{isDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {categories.length === 0 ? (
                  <Text style={{ padding: 12, color: '#aaa', fontStyle: 'italic' }}>Nenhuma categoria existe ainda.</Text>
                ) : (
                  categories.map(cat => (
                    <TouchableOpacity key={cat.id} style={styles.dropdownItem} onPress={() => { setNewProdCatId(cat.id); setIsDropdownOpen(false); }}>
                      <Text style={newProdCatId === cat.id ? styles.dropdownItemTextActive : styles.dropdownItemText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <TouchableOpacity style={[styles.actionBtn, { marginTop: 20 }]} onPress={handleCreateProduct}>
              <Text style={styles.actionBtnText}>Cadastrar Produto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#FF69B4', textAlign: 'center', marginTop: 20 },
  pageSubtitle: { fontSize: 13, color: '#8B5A2B', textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B5A2B', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#FFC0CB', paddingBottom: 5 },
  
  stockCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#8B5A2B' },
  productCategory: { fontSize: 11, color: '#FF69B4' },
  counterContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  counterBtn: { backgroundColor: '#FFF5F7', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFC0CB' },
  counterText: { fontSize: 18, color: '#FF69B4', fontWeight: 'bold' },
  stockNumber: { fontSize: 15, fontWeight: 'bold', width: 30, textAlign: 'center', color: '#5D4037' },
  saveBtn: { backgroundColor: '#FF69B4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  saveBtnDisabled: { backgroundColor: '#D3D3D3' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  
  adminSection: { backgroundColor: '#FFF5F7', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#FFC0CB', marginBottom: 40 },
  adminCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#8B5A2B', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#FFC0CB', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#FFFBFD', marginBottom: 10, color: '#5D4037' },
  actionBtn: { backgroundColor: '#8B5A2B', padding: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 15, resizeMode: 'cover', borderWidth: 1, borderColor: '#FFC0CB' },
  
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFC0CB', borderRadius: 10, padding: 12, backgroundColor: '#FFFBFD' },
  dropdownList: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFC0CB', borderRadius: 10, marginTop: 5, maxHeight: 150 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#FFF0F5' },
  dropdownItemText: { fontSize: 14, color: '#8B5A2B' },
  dropdownItemTextActive: { fontSize: 14, color: '#FF69B4', fontWeight: 'bold' }
});