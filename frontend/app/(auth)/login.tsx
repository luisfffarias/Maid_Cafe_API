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
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      console.log('Login ok:', data);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Erro login:', err);
      setError(err.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.title}>Maid Café</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>E-mail</Text>
        <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#aaa"
          keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#aaa"
          secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0eb', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#2d1b12', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 },
  error: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e0d6cf', borderRadius: 10, padding: 12, fontSize: 15, color: '#222', backgroundColor: '#fdfaf8' },
  button: { backgroundColor: '#c0392b', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#888', fontSize: 14 },
  linkBold: { color: '#c0392b', fontWeight: '600' },
});