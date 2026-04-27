import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { login } from '../../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha, por favor! 🐾');
      return;
    }
    
    setLoading(true);
    
    try {
      // Faz a chamada real para a API. 
      // O token será guardado automaticamente pelo seu api.ts
      await login(email.trim(), password);
      
      console.log('Login efetuado com sucesso! Redirecionando...');
      
      // Libera a entrada para o Maid Café
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.log('Erro no login:', err.message);
      // Exibe a mensagem de erro que veio do backend (ex: "Senha incorreta")
      setError(err.message || 'Erro ao conectar. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.cardContainer}>
        {/* Orelhinhas de Gatinho */}
        <View style={[styles.ear, styles.leftEar]}>
          <View style={styles.innerEar} />
        </View>
        <View style={[styles.ear, styles.rightEar]}>
          <View style={styles.innerEar} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>MaidInBrasil</Text>
          <Text style={styles.subtitle}>Bem-vindo(a)🌸</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput 
            style={styles.input} 
            placeholder="mestre@email.com" 
            placeholderTextColor="#FFA6C9"
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={email} 
            onChangeText={setEmail} 
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            placeholderTextColor="#FFA6C9"
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>
              Ainda não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF0F5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 40,
  },
  card: { 
    width: '100%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 32, 
    elevation: 8,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 2, 
  },
  
  ear: {
    position: 'absolute',
    top: -35,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    zIndex: 1,
  },
  leftEar: {
    left: 40,
    transform: [{ rotate: '-20deg' }],
  },
  rightEar: {
    right: 40,
    transform: [{ rotate: '20deg' }],
  },
  innerEar: {
    position: 'absolute',
    top: 15,
    left: -15, 
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFC0CB',
  },

  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#FF69B4', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#8B5A2B', 
    textAlign: 'center', 
    marginBottom: 28 
  },
  error: { 
    backgroundColor: '#FFE4E1', 
    color: '#D81B60', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 16, 
    textAlign: 'center',
    fontWeight: '600'
  },
  label: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#8B5A2B', 
    marginBottom: 8, 
    marginTop: 12 
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#FFC0CB', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    color: '#5D4037', 
    backgroundColor: '#FFFBFD' 
  },
  button: { 
    backgroundColor: '#FF69B4', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 28, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  link: { textAlign: 'center', color: '#8B5A2B', fontSize: 14 },
  linkBold: { color: '#FF69B4', fontWeight: '700' },
});