import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get('/users/me');
        setProfile(data);
      } catch {
        setProfile(user);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const data = profile || user;
  const memberSince = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const roleBadge = {
    admin: { label: 'Administrateur', color: '#ef4444', bg: '#fef2f2' },
    organizer: { label: 'Organisateur', color: '#f59e0b', bg: '#fffbeb' },
    participant: { label: 'Participant', color: '#3b82f6', bg: '#eff6ff' },
  };

  const role = roleBadge[data?.role] || roleBadge.participant;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="bg-amber-500 px-6 pt-14 pb-12 items-center rounded-b-3xl">
        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
          <Text className="text-3xl font-bold text-white">
            {(data?.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold">{data?.name || 'Utilisateur'}</Text>
        <Text className="text-amber-100 text-sm mt-1">{data?.email}</Text>
        <View
          className="mt-3 px-3 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Text className="text-white text-xs font-medium">{role.label}</Text>
        </View>
      </View>

      {/* Infos */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-slate-900 mb-3">Informations</Text>

        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ProfileRow icon="person-outline" label="Nom" value={data?.name} />
          <ProfileRow icon="mail-outline" label="Email" value={data?.email} />
          <ProfileRow icon="shield-outline" label="Rôle" value={role.label} valueColor={role.color} />
          {memberSince ? (
            <ProfileRow icon="calendar-outline" label="Membre depuis" value={memberSince} isLast />
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-slate-900 mb-3">Paramètres</Text>

        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ActionRow icon="notifications-outline" label="Notifications" />
          <ActionRow icon="lock-closed-outline" label="Confidentialité" />
          <ActionRow icon="help-circle-outline" label="Aide & support" isLast />
        </View>
      </View>

      {/* Déconnexion */}
      <View className="px-4 mt-6">
        <TouchableOpacity
          className="bg-red-50 rounded-2xl p-4 flex-row items-center justify-center"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-xs text-slate-400 mt-6">Evencia Mobile v1.0.0</Text>
    </ScrollView>
  );
}

function ProfileRow({ icon, label, value, valueColor, isLast }) {
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <Ionicons name={icon} size={20} color="#f59e0b" />
      <Text className="text-sm text-slate-500 ml-3 flex-1">{label}</Text>
      <Text className="text-sm font-medium" style={{ color: valueColor || '#0f172a' }}>
        {value || '—'}
      </Text>
    </View>
  );
}

function ActionRow({ icon, label, isLast }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b border-slate-100' : ''}`}
      activeOpacity={0.6}
    >
      <Ionicons name={icon} size={20} color="#64748b" />
      <Text className="text-sm text-slate-700 ml-3 flex-1">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}
