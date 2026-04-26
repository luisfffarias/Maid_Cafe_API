import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native';
import {
  getUsers, updateUserRole, deleteUser, getToken, decodeToken,
  User, Role,
} from '../../services/api';

const ROLES: Role[] = ['USER', 'MAID', 'ADMIN'];
const ROLE_LABEL: Record<Role, string> = { USER: 'Cliente', MAID: 'Maid', ADMIN: 'Admin' };
const ROLE_COLOR: Record<Role, string> = { USER: '#aaa', MAID: '#e91e8c', ADMIN: '#c2185b' };

export default function AdminScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError('');
    try {
      const token = await getToken();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded) setCurrentUserId(decoded.sub);
      }
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleRoleChange(user: User, role: Role) {
    setUpdatingId(user.id);
    try {
      const updated = await updateUserRole(user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)));
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function executeDelete(user: User) {
    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleDelete(user: User) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Excluir ${user.name}? Esta ação não pode ser desfeita.`)) {
        executeDelete(user);
      }
    } else {
      Alert.alert(
        'Excluir usuário',
        `Tem certeza que deseja excluir ${user.name}? Esta ação não pode ser desfeita.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => executeDelete(user) },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Painel Admin</Text>
        <Text style={styles.headerSub}>Gerencie os acessos do Maid Café</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={usersLoading} onRefresh={loadUsers} tintColor="#e91e8c" />}
      >
        {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}

        {users.filter((u) => u.id !== currentUserId).map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[user.role] + '22' }]}>
                  <Text style={[styles.roleBadgeText, { color: ROLE_COLOR[user.role] }]}>
                    {ROLE_LABEL[user.role]}
                  </Text>
                </View>
              </View>

              {/* Botão excluir */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(user)}
                disabled={deletingId === user.id}
              >
                {deletingId === user.id
                  ? <ActivityIndicator color="#c2185b" size="small" />
                  : <Text style={styles.deleteBtnText}>🗑️</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Botões de role */}
            <View style={styles.roleButtons}>
              {updatingId === user.id ? (
                <ActivityIndicator color="#e91e8c" />
              ) : (
                ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, user.role === r && { backgroundColor: ROLE_COLOR[r] }]}
                    onPress={() => handleRoleChange(user, r)}
                    disabled={user.role === r}
                  >
                    <Text style={[styles.roleBtnText, user.role === r && { color: '#fff' }]}>
                      {ROLE_LABEL[r]}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff0f6' },
  header: {
    backgroundColor: '#fff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#fce4ec',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#c2185b' },
  headerSub: { fontSize: 13, color: '#f48fb1', fontStyle: 'italic', marginTop: 2 },

  scroll: { padding: 16 },
  errorText: { color: '#c2185b', backgroundColor: '#fce4ec', padding: 10, borderRadius: 10, marginBottom: 12, textAlign: 'center' },

  userCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#fce4ec', elevation: 2,
  },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#2d1b2e' },
  userEmail: { fontSize: 12, color: '#aaa', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },

  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: '#fce4ec', marginLeft: 8 },
  deleteBtnText: { fontSize: 18 },

  roleButtons: { flexDirection: 'row', gap: 8 },
  roleBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#f8bbd0', backgroundColor: '#fff9fb', alignItems: 'center',
  },
  roleBtnText: { fontSize: 12, fontWeight: '600', color: '#ad1457' },
});