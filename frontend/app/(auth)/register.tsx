import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { register } from '../../services/api'; // Descomente no seu projeto

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. Novo estado para confirmar a senha
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister() {
    setError('');
    setSuccess('');
    
    // 2. Verifica se algum campo está vazio
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Preencha todos os campos, por favor! 🐾');
      return;
    }

    // 3. Validação de tamanho do nome
    if (name.trim().length < 3) {
      setError('O nome precisa ter pelo menos 3 letras.');
      return;
    }

    // 4. Validação de formato de e-mail usando Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, digite um e-mail válido! 😿');
      return;
    }

    // 5. Validação de tamanho e segurança da senha
    if (password.length < 6) {
      setError('A senha é muito fraca. Use pelo menos 6 caracteres!');
      return;
    }

    // 6. Verifica se as senhas são idênticas
    if (password !== confirmPassword) {
      setError('As senhas não combinam. Digite com cuidado! 🐾');
      return;
    }
    
    setLoading(true);
    try {
      // Como o default é cliente na API, enviamos apenas os dados básicos
      const data = await register(name.trim(), email.trim(), password);
      console.log('Cadastro ok:', data);
      
      // Simulando o delay da API
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      setSuccess('Conta criada, Mestre! Preparando sua mesa... ☕');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err: any) {
      console.log('Erro cadastro:', err);
      setError(err.message || 'Erro ao cadastrar. Tente novamente!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.cardContainer}>
          {/* Orelhinhas de Gatinho */}
          <View style={[styles.ear, styles.leftEar]}>
            <View style={styles.innerEar} />
          </View>
          <View style={[styles.ear, styles.rightEar]}>
            <View style={styles.innerEar} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha os dados para entrar no café 🍰</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.successMsg}>{success}</Text> : null}

            <Text style={styles.label}>Nome</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Seu nome completo" 
              placeholderTextColor="#FFA6C9"
              value={name} 
              onChangeText={setName} 
            />

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

            {/* Novo Campo: Confirmar Senha */}
            <Text style={styles.label}>Confirmar Senha</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#FFA6C9"
              secureTextEntry 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>
                Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF0F5' 
  },
  scroll: { 
    flexGrow: 1, 
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

  // Orelhinhas de Gatinho
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
    fontSize: 28, 
    fontWeight: '800', 
    color: '#FF69B4', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 14, 
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
  successMsg: { 
    backgroundColor: '#E8F5E9', 
    color: '#2E7D32', 
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