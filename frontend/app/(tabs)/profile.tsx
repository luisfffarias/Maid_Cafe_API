import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { logout } from '../../services/api';

export default function ProfileScreen() {

  async function executeLogout() {
    try {
      await logout(); // Remove o access_token do AsyncStorage
      console.log("Token removido, saindo...");
      
      // No Expo Router, usamos o caminho completo do grupo para garantir o redirecionamento
      router.replace('/(auth)/login'); 
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  function handleLogout() {
    // No navegador, o Alert.alert com botões pode não funcionar. 
    // Usamos o confirm nativo do browser se for Web.
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Tem a certeza que deseja ir embora, Mestre?");
      if (confirmed) executeLogout();
    } else {
      Alert.alert(
        "Sair do Café",
        "Tem a certeza que deseja ir embora, Mestre?",
        [
          { text: "Ficar", style: "cancel" },
          { 
            text: "Sair", 
            style: "destructive",
            onPress: executeLogout
          }
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarEmoji}>👤</Text>
      </View>
      
      <Text style={styles.name}>Mestre</Text>
      <Text style={styles.role}>Bem-vindo ao seu perfil</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair do Café 👋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF0F5', 
    alignItems: 'center', 
    paddingTop: 60, 
    paddingHorizontal: 20 
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    backgroundColor: '#FFC0CB', 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16, 
    elevation: 4, 
    shadowColor: '#FFB6C1', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6 
  },
  avatarEmoji: { fontSize: 40 },
  name: { fontSize: 24, fontWeight: '800', color: '#FF69B4', marginBottom: 4 },
  role: { fontSize: 16, color: '#8B5A2B', fontWeight: '600', marginBottom: 40 },
  logoutButton: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 2, 
    borderColor: '#FF69B4', 
    borderRadius: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 30, 
    width: '100%', 
    alignItems: 'center' 
  },
  logoutText: { color: '#FF69B4', fontWeight: 'bold', fontSize: 16 },
});