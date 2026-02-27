import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { key: 'musique', label: 'Musique', icon: 'musical-notes', color: '#ec4899' },
  { key: 'sport', label: 'Sport', icon: 'football', color: '#22c55e' },
  { key: 'conference', label: 'Conférences', icon: 'mic', color: '#3b82f6' },
  { key: 'theatre', label: 'Théâtre', icon: 'happy', color: '#a855f7' },
  { key: 'cinema', label: 'Cinéma', icon: 'film', color: '#ef4444' },
  { key: 'gastronomie', label: 'Gastronomie', icon: 'restaurant', color: '#f97316' },
  { key: 'festival', label: 'Festivals', icon: 'sparkles', color: '#eab308' },
  { key: 'networking', label: 'Networking', icon: 'people', color: '#6366f1' },
];

function EventCard({ event, onPress }) {
  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';
  const priceStr = event.price != null && Number(event.price) > 0
    ? `${Number(event.price).toFixed(2)} €`
    : 'Gratuit';

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl mr-4 overflow-hidden shadow-sm"
      style={{ width: 260 }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} className="w-full h-36" resizeMode="cover" />
      ) : (
        <View className="w-full h-36 bg-amber-500 items-center justify-center">
          <Ionicons name="calendar" size={40} color="#fff" />
        </View>
      )}
      <View className="p-4">
        <Text className="text-base font-bold text-slate-900 mb-1" numberOfLines={1}>
          {event.title}
        </Text>
        <View className="flex-row items-center mb-1">
          <Ionicons name="calendar-outline" size={14} color="#f59e0b" />
          <Text className="text-xs text-slate-500 ml-1">{dateStr}</Text>
          <Ionicons name="location-outline" size={14} color="#f59e0b" style={{ marginLeft: 12 }} />
          <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>{event.location || '—'}</Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm font-semibold text-amber-600">{priceStr}</Text>
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 ml-1">{event.participants_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const loadEvents = async () => {
    try {
      const { data } = await apiClient.get('/events', { params: { page: 1, limit: 10 } });
      setEvents(data.events || []);
    } catch (err) {
      console.warn('Erreur chargement events:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const onRefresh = () => { setRefreshing(true); loadEvents(); };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />}
    >
      {/* Hero */}
      <View className="bg-amber-500 px-6 pt-14 pb-10 rounded-b-3xl">
        <Text className="text-white text-sm mb-1">
          Bienvenue{user?.name ? `, ${user.name}` : ''} 👋
        </Text>
        <Text className="text-white text-2xl font-bold mb-2">Découvrez les{'\n'}événements</Text>
        <Text className="text-amber-100 text-sm">
          Trouvez et inscrivez-vous aux meilleurs événements près de chez vous
        </Text>
      </View>

      {/* Catégories */}
      <View className="mt-6 px-4">
        <Text className="text-lg font-bold text-slate-900 mb-3">Catégories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              className="items-center mr-5"
              onPress={() => navigation.navigate('SearchTab', { screen: 'Search', params: { category: cat.key } })}
            >
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text className="text-xs text-slate-600">{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Événements à la une */}
      <View className="mt-6 px-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-slate-900">À la une</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
            <Text className="text-sm text-amber-600 font-medium">Voir tout</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            />
          ))}
        </ScrollView>
      </View>

      {/* Événements à venir */}
      <View className="mt-6 px-4 pb-8">
        <Text className="text-lg font-bold text-slate-900 mb-3">Tous les événements</Text>
        {events.map((event) => {
          const dateStr = event.event_date
            ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          const priceStr = event.price != null && Number(event.price) > 0
            ? `${Number(event.price).toFixed(2)} €`
            : 'Gratuit';

          return (
            <TouchableOpacity
              key={event.id}
              className="bg-white rounded-2xl mb-3 flex-row overflow-hidden shadow-sm"
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              activeOpacity={0.8}
            >
              {event.image_url ? (
                <Image source={{ uri: event.image_url }} className="w-24 h-24" resizeMode="cover" />
              ) : (
                <View className="w-24 h-24 bg-amber-500 items-center justify-center">
                  <Ionicons name="calendar" size={28} color="#fff" />
                </View>
              )}
              <View className="flex-1 p-3 justify-center">
                <Text className="text-sm font-bold text-slate-900 mb-1" numberOfLines={1}>{event.title}</Text>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
                  <Text className="text-xs text-slate-500 ml-1">{dateStr}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={12} color="#f59e0b" />
                  <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>{event.location}</Text>
                </View>
              </View>
              <View className="justify-center pr-3">
                <Text className="text-xs font-semibold text-amber-600">{priceStr}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
