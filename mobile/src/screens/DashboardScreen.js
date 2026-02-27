import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

function StatCard({ icon, label, value, color }) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 mx-1 shadow-sm">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: color + '20' }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-slate-900">{value}</Text>
      <Text className="text-xs text-slate-500 mt-1">{label}</Text>
    </View>
  );
}

function OrganizerDashboard({ navigation }) {
  const [data, setData] = useState({ events: [], stats: {} });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: result } = await apiClient.get('/events/organizer/my-events');
      setData(result);
    } catch (err) {
      console.warn('Erreur dashboard orga:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const stats = data.stats || {};

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="bg-amber-500 px-6 pt-14 pb-8 rounded-b-3xl">
        <Text className="text-amber-100 text-sm">Dashboard</Text>
        <Text className="text-white text-2xl font-bold">Organisateur</Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 mt-4">
        <StatCard icon="calendar" label="Événements" value={stats.totalEvents || 0} color="#f59e0b" />
        <StatCard icon="ticket" label="Tickets vendus" value={stats.totalTicketsSold || 0} color="#22c55e" />
      </View>
      <View className="flex-row px-4 mt-2">
        <StatCard
          icon="cash"
          label="Revenus"
          value={`${Number(stats.totalRevenue || 0).toFixed(0)} €`}
          color="#3b82f6"
        />
        <StatCard
          icon="trending-up"
          label="Moy. participants"
          value={
            stats.totalEvents > 0
              ? Math.round((stats.totalTicketsSold || 0) / stats.totalEvents)
              : 0
          }
          color="#a855f7"
        />
      </View>

      {/* Mes événements */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-slate-900 mb-3">Mes événements</Text>
        {(data.events || []).length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
            <Text className="text-slate-400 mt-2">Aucun événement créé</Text>
          </View>
        ) : (
          (data.events || []).map((event) => {
            const dateStr = event.event_date
              ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : '';
            const fill = event.max_tickets > 0
              ? Math.round(((event.tickets_sold || event.participants_count || 0) / event.max_tickets) * 100)
              : 0;
            const fillColor = fill >= 80 ? '#ef4444' : fill >= 50 ? '#f59e0b' : '#22c55e';

            return (
              <TouchableOpacity
                key={event.id}
                className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                activeOpacity={0.8}
              >
                <View className="flex-row">
                  {event.image_url ? (
                    <Image source={{ uri: event.image_url }} className="w-24 h-24" resizeMode="cover" />
                  ) : (
                    <View className="w-24 h-24 bg-amber-500 items-center justify-center">
                      <Ionicons name="calendar" size={28} color="#fff" />
                    </View>
                  )}
                  <View className="flex-1 p-3 justify-center">
                    <Text className="text-sm font-bold text-slate-900 mb-1" numberOfLines={1}>{event.title}</Text>
                    <Text className="text-xs text-slate-500 mb-2">📅 {dateStr}</Text>
                    {/* Barre de remplissage */}
                    <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(fill, 100)}%`, backgroundColor: fillColor }}
                      />
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">
                      {event.tickets_sold || event.participants_count || 0}/{event.max_tickets || '∞'} places ({fill}%)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function ParticipantDashboard({ navigation }) {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await apiClient.get('/inscriptions/my');
      setInscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Erreur inscriptions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const upcoming = inscriptions.filter((i) => new Date(i.event_date) >= new Date());
  const past = inscriptions.filter((i) => new Date(i.event_date) < new Date());

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="bg-amber-500 px-6 pt-14 pb-8 rounded-b-3xl">
        <Text className="text-amber-100 text-sm">Dashboard</Text>
        <Text className="text-white text-2xl font-bold">Mes inscriptions</Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 mt-4">
        <StatCard icon="ticket" label="Total inscriptions" value={inscriptions.length} color="#f59e0b" />
        <StatCard icon="time" label="À venir" value={upcoming.length} color="#22c55e" />
        <StatCard icon="checkmark-circle" label="Passés" value={past.length} color="#94a3b8" />
      </View>

      {/* À venir */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-slate-900 mb-3">À venir</Text>
        {upcoming.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
            <Text className="text-slate-400 mt-2">Aucun événement à venir</Text>
          </View>
        ) : (
          upcoming.map((insc) => (
            <InscriptionCard key={insc.id} inscription={insc} navigation={navigation} />
          ))
        )}
      </View>

      {/* Passés */}
      {past.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-slate-900 mb-3">Passés</Text>
          {past.map((insc) => (
            <InscriptionCard key={insc.id} inscription={insc} navigation={navigation} isPast />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InscriptionCard({ inscription, navigation, isPast }) {
  const dateStr = inscription.event_date
    ? new Date(inscription.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity
      className={`bg-white rounded-2xl mb-3 flex-row overflow-hidden shadow-sm ${isPast ? 'opacity-60' : ''}`}
      onPress={() => navigation.navigate('EventDetail', { eventId: inscription.event_id })}
      activeOpacity={0.8}
    >
      {inscription.event_image_url ? (
        <Image source={{ uri: inscription.event_image_url }} className="w-24 h-24" resizeMode="cover" />
      ) : (
        <View className="w-24 h-24 bg-amber-500 items-center justify-center">
          <Ionicons name="calendar" size={28} color="#fff" />
        </View>
      )}
      <View className="flex-1 p-3 justify-center">
        <Text className="text-sm font-bold text-slate-900 mb-1" numberOfLines={1}>
          {inscription.event_title}
        </Text>
        <View className="flex-row items-center mb-1">
          <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
          <Text className="text-xs text-slate-500 ml-1">{dateStr}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={12} color="#f59e0b" />
          <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
            {inscription.event_location || '—'}
          </Text>
        </View>
      </View>
      <View className="justify-center pr-3">
        <View className={`px-2 py-1 rounded-full ${isPast ? 'bg-slate-100' : 'bg-green-50'}`}>
          <Text className={`text-xs font-medium ${isPast ? 'text-slate-500' : 'text-green-600'}`}>
            {isPast ? 'Terminé' : 'Confirmé'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  if (!user) return null;

  const isOrganizer = user.role === 'organizer' || user.role === 'admin';

  return isOrganizer
    ? <OrganizerDashboard navigation={navigation} />
    : <ParticipantDashboard navigation={navigation} />;
}
