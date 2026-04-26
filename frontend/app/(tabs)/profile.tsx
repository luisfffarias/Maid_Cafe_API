import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { logout } from '../../services/api';

export default function ProfileScreen() {

  async function handleLogout() {
    Alert.alert(
      "Sair do Café",
      "Tem a certeza que deseja ir embora, Mestre?",
      [
        { text: "Ficar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            await logout(); // Limpa o token do AsyncStorage
            router.replace('/(auth)/login'); // Manda para o login
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarEmoji}>👤</Text>
      </View>
      
      <Text style={styles.name}>Mestre</Text>
      <Text style={styles.role}>Cliente VIP</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair do Café 👋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  avatarPlaceholder: { width: 100, height: 100, backgroundColor: '#FFC0CB', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#FFB6C1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  avatarEmoji: { fontSize: 40 },
  name: { fontSize: 24, fontWeight: '800', color: '#FF69B4', marginBottom: 4 },
  role: { fontSize: 16, color: '#8B5A2B', fontWeight: '600', marginBottom: 40 },
  logoutButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FF69B4', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, width: '100%', alignItems: 'center' },
  logoutText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
});