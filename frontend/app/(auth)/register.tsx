import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { register, Role } from '../../services/api';

const ROLES: { label: string; value: Role }[] = [
  { label: 'Cliente', value: 'USER' },
  { label: 'Maid', value: 'MAID' },
  { label: 'Admin', value: 'ADMIN' },
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister() {
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim(), password, role);
      console.log('Cadastro ok:', data);
      setSuccess('Conta criada! Redirecionando para o login...');
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch (err: any) {
      console.log('Erro cadastro:', err);
      setError(err.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha os dados abaixo</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.successMsg}>{success}</Text> : null}

          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#aaa"
            value={name} onChangeText={setName} />

          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#aaa"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Senha</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#aaa"
            secureTextEntry value={password} onChangeText={setPassword} />

          <Text style={styles.label}>Perfil</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r.value} style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                onPress={() => setRole(r.value)}>
                <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Já tem conta? <Text style={styles.linkBold}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0eb' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#2d1b12', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 },
  error: { backgroundColor: '#fdecea', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' },
  successMsg: { backgroundColor: '#eafaf1', color: '#27ae60', padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e0d6cf', borderRadius: 10, padding: 12, fontSize: 15, color: '#222', backgroundColor: '#fdfaf8' },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleBtn: { flex: 1, borderWidth: 1, borderColor: '#e0d6cf', borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: '#fdfaf8' },
  roleBtnActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  roleBtnTextActive: { color: '#fff' },
  button: { backgroundColor: '#c0392b', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#888', fontSize: 14 },
  linkBold: { color: '#c0392b', fontWeight: '600' },
});