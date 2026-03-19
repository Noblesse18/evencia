import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(null);

  const loadData = async () => {
    try {
      const [profileRes, inscRes] = await Promise.all([
        apiClient.get('/users/me').catch(() => null),
        apiClient.get('/inscriptions/my').catch(() => null),
      ]);
      setProfile(profileRes?.data || user);
      setInscriptions(Array.isArray(inscRes?.data) ? inscRes.data : []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, []));

  const handleUnsubscribe = (inscription) => {
    Alert.alert(
      'Se désinscrire',
      `Voulez-vous vraiment vous désinscrire de "${inscription.event_title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se désinscrire',
          style: 'destructive',
          onPress: async () => {
            setUnsubscribing(inscription.id);
            try {
              await apiClient.delete(`/inscriptions/${inscription.id}`);
              setInscriptions((prev) => prev.filter((i) => i.id !== inscription.id));
              Alert.alert('Succès', 'Vous avez été désinscrit.');
            } catch (err) {
              const msg = err.response?.data?.message || 'Erreur lors de la désinscription.';
              Alert.alert('Erreur', msg);
            } finally {
              setUnsubscribing(null);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const data = profile || user;
  const memberSince = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const roleBadge = {
    admin: { label: 'Administrateur', color: '#ef4444' },
    organizer: { label: 'Organisateur', color: '#f59e0b' },
    participant: { label: 'Participant', color: '#3b82f6' },
  };

  const role = roleBadge[data?.role] || roleBadge.participant;

  const upcoming = inscriptions.filter((i) => new Date(i.event_date) >= new Date());
  const past = inscriptions.filter((i) => new Date(i.event_date) < new Date());

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#0a0a0f' }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="bg-amber-500 px-6 pt-14 pb-12 items-center rounded-b-3xl">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Text className="text-3xl font-bold text-white">
            {(data?.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold">{data?.name || 'Utilisateur'}</Text>
        <Text className="text-amber-100 text-sm mt-1">{data?.email}</Text>
        <View className="mt-3 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Text className="text-white text-xs font-medium">{role.label}</Text>
        </View>
      </View>

      {/* Infos */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-white mb-3">Informations</Text>
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
          <ProfileRow icon="person-outline" label="Nom" value={data?.name} />
          <ProfileRow icon="mail-outline" label="Email" value={data?.email} />
          <ProfileRow icon="shield-outline" label="Rôle" value={role.label} valueColor={role.color} />
          {memberSince ? (
            <ProfileRow icon="calendar-outline" label="Membre depuis" value={memberSince} isLast />
          ) : null}
        </View>
      </View>

      {/* Mes inscriptions */}
      <View className="px-4 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-white">Mes inscriptions</Text>
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1e293b' }}>
            <Text className="text-xs font-medium text-amber-400">{inscriptions.length}</Text>
          </View>
        </View>

        {inscriptions.length === 0 ? (
          <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: '#0f172a' }}>
            <Ionicons name="calendar-outline" size={40} color="#475569" />
            <Text className="text-slate-500 mt-2">Aucune inscription</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-slate-400 mb-2">À venir</Text>
                {upcoming.map((insc) => (
                  <InscriptionCard
                    key={insc.id}
                    inscription={insc}
                    onPress={() => navigation.navigate('EventDetail', { eventId: insc.event_id })}
                    onUnsubscribe={() => handleUnsubscribe(insc)}
                    isLoading={unsubscribing === insc.id}
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-slate-400 mb-2 mt-3">Passés</Text>
                {past.map((insc) => (
                  <InscriptionCard
                    key={insc.id}
                    inscription={insc}
                    isPast
                    onPress={() => navigation.navigate('EventDetail', { eventId: insc.event_id })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </View>

      {/* Actions */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-white mb-3">Paramètres</Text>
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
          <ActionRow icon="notifications-outline" label="Notifications" />
          <ActionRow icon="lock-closed-outline" label="Confidentialité" />
          <ActionRow icon="help-circle-outline" label="Aide & support" isLast />
        </View>
      </View>

      {/* Déconnexion */}
      <View className="px-4 mt-6">
        <TouchableOpacity
          className="rounded-2xl p-4 flex-row items-center justify-center"
          style={{ backgroundColor: '#1c1917' }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-xs text-slate-600 mt-6">Evencia Mobile v1.0.0</Text>
    </ScrollView>
  );
}

function InscriptionCard({ inscription, onPress, onUnsubscribe, isLoading, isPast }) {
  const dateStr = inscription.event_date
    ? new Date(inscription.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity
      className={`rounded-2xl mb-3 overflow-hidden ${isPast ? 'opacity-60' : ''}`}
      style={{ backgroundColor: '#0f172a' }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row">
        {inscription.event_image_url ? (
          <Image source={{ uri: inscription.event_image_url }} className="w-24 h-24" resizeMode="cover" />
        ) : (
          <View className="w-24 h-24 bg-amber-500 items-center justify-center">
            <Ionicons name="calendar" size={28} color="#fff" />
          </View>
        )}
        <View className="flex-1 p-3 justify-center">
          <Text className="text-sm font-bold text-white mb-1" numberOfLines={1}>
            {inscription.event_title}
          </Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
            <Text className="text-xs text-slate-400 ml-1">{dateStr}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={12} color="#f59e0b" />
            <Text className="text-xs text-slate-400 ml-1" numberOfLines={1}>
              {inscription.event_location || '—'}
            </Text>
          </View>
        </View>
        <View className="justify-center pr-3">
          {!isPast && onUnsubscribe ? (
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#450a0a' }}
              onPress={onUnsubscribe}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text className="text-xs font-medium text-red-400">Désinscrire</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: '#1e293b' }}>
              <Text className="text-xs font-medium text-slate-400">Terminé</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ProfileRow({ icon, label, value, valueColor, isLast }) {
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b' : ''}`} style={!isLast ? { borderBottomColor: '#1e293b' } : undefined}>
      <Ionicons name={icon} size={20} color="#f59e0b" />
      <Text className="text-sm text-slate-400 ml-3 flex-1">{label}</Text>
      <Text className="text-sm font-medium" style={{ color: valueColor || '#f1f5f9' }}>
        {value || '—'}
      </Text>
    </View>
  );
}

function ActionRow({ icon, label, isLast }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-3.5 ${!isLast ? 'border-b' : ''}`}
      style={!isLast ? { borderBottomColor: '#1e293b' } : undefined}
      activeOpacity={0.6}
    >
      <Ionicons name={icon} size={20} color="#94a3b8" />
      <Text className="text-sm text-slate-300 ml-3 flex-1">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#475569" />
    </TouchableOpacity>
  );
}
