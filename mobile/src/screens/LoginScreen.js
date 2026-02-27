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
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-amber-500 rounded-2xl items-center justify-center mb-3">
            <Ionicons name="calendar" size={32} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-slate-900">Evencia</Text>
          <Text className="text-slate-500 text-sm mt-1">Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Email */}
          <Text className="text-sm font-medium text-slate-700 mb-1">Email</Text>
          <View className="flex-row items-center bg-slate-50 rounded-xl px-3 py-2.5 mb-4 border border-slate-200">
            <Ionicons name="mail-outline" size={18} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-2 text-base text-slate-900"
              placeholder="votre@email.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Password */}
          <Text className="text-sm font-medium text-slate-700 mb-1">Mot de passe</Text>
          <View className="flex-row items-center bg-slate-50 rounded-xl px-3 py-2.5 mb-4 border border-slate-200">
            <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-2 text-base text-slate-900"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-red-50 rounded-xl px-3 py-2 mb-4 flex-row items-center">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-600 text-sm ml-2 flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Button */}
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
