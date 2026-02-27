import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir email et mot de passe.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-amber-500 rounded-2xl items-center justify-center mb-3">
            <Ionicons name="calendar" size={32} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-white">Evencia</Text>
          <Text className="text-slate-400 text-sm mt-1">Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View className="rounded-2xl p-6" style={{ backgroundColor: '#0f172a' }}>
          <Text className="text-sm font-medium text-slate-300 mb-1">Email</Text>
          <View className="flex-row items-center rounded-xl px-3 py-2.5 mb-4" style={{ backgroundColor: '#1e293b' }}>
            <Ionicons name="mail-outline" size={18} color="#64748b" />
            <TextInput
              className="flex-1 ml-2 text-base text-white"
              placeholder="votre@email.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Text className="text-sm font-medium text-slate-300 mb-1">Mot de passe</Text>
          <View className="flex-row items-center rounded-xl px-3 py-2.5 mb-4" style={{ backgroundColor: '#1e293b' }}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
            <TextInput
              className="flex-1 ml-2 text-base text-white"
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="rounded-xl px-3 py-2 mb-4 flex-row items-center" style={{ backgroundColor: '#450a0a' }}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-400 text-sm ml-2 flex-1">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`bg-amber-500 rounded-xl py-4 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
