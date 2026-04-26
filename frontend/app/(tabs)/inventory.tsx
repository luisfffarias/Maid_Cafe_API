import { View, Text, StyleSheet } from 'react-native';

export default function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📦</Text>
      <Text style={styles.title}>Gestão de Estoque</Text>
      <Text style={styles.subtitle}>Área restrita para Maids e Admins.</Text>
      <Text style={styles.info}>Em breve: Controlo de ingredientes e disponibilidade de pratos!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F5', justifyContent: 'center', alignItems: 'center', padding: 24 },
  emoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#FF69B4', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8B5A2B', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  info: { fontSize: 14, color: '#A0522D', textAlign: 'center', opacity: 0.8 },
});