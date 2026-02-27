import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const CATEGORIES = [
  { key: '', label: 'Tous' },
  { key: 'musique', label: 'Musique' },
  { key: 'sport', label: 'Sport' },
  { key: 'conference', label: 'Conférences' },
  { key: 'theatre', label: 'Théâtre' },
  { key: 'cinema', label: 'Cinéma' },
  { key: 'gastronomie', label: 'Gastronomie' },
  { key: 'festival', label: 'Festivals' },
  { key: 'networking', label: 'Networking' },
];

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    if (route.params?.category) {
      setCategory(route.params.category);
    }
  }, [route.params?.category]);

  const loadEvents = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      const { data } = await apiClient.get('/events', { params });
      setEvents(reset ? (data.events || []) : [...events, ...(data.events || [])]);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.warn('Search error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { loadEvents(1, true); }, [category]);

  const handleSearch = () => { loadEvents(1, true); };

  const loadMore = () => {
    if (page < totalPages && !loading) loadEvents(page + 1);
  };

  const renderItem = ({ item }) => {
    const dateStr = item.event_date
      ? new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '';
    const priceStr = item.price != null && Number(item.price) > 0
      ? `${Number(item.price).toFixed(2)} €`
      : 'Gratuit';

    return (
      <TouchableOpacity
        className="rounded-2xl mb-3 mx-4 flex-row overflow-hidden"
        style={{ backgroundColor: '#0f172a' }}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.8}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-28 h-28" resizeMode="cover" />
        ) : (
          <View className="w-28 h-28 bg-amber-500 items-center justify-center">
            <Ionicons name="calendar" size={32} color="#fff" />
          </View>
        )}
        <View className="flex-1 p-3 justify-center">
          <Text className="text-sm font-bold text-white mb-1" numberOfLines={2}>{item.title}</Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
            <Text className="text-xs text-slate-400 ml-1">{dateStr}</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Ionicons name="location-outline" size={12} color="#f59e0b" />
            <Text className="text-xs text-slate-400 ml-1" numberOfLines={1}>{item.location || '—'}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-amber-500">{priceStr}</Text>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e293b' }}>
              <Text className="text-xs text-amber-400">{item.category || '—'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Search bar */}
      <View className="px-4 pt-14 pb-4" style={{ backgroundColor: '#0f172a' }}>
        <Text className="text-xl font-bold text-white mb-3">Rechercher</Text>
        <View className="flex-row items-center rounded-xl px-3 py-2" style={{ backgroundColor: '#1e293b' }}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-base text-white"
            placeholder="Rechercher un événement..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); loadEvents(1, true); }}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category pills */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                category === item.key ? 'bg-amber-500' : ''
              }`}
              style={category !== item.key ? { backgroundColor: '#1e293b' } : undefined}
              onPress={() => setCategory(item.key)}
            >
              <Text className={`text-sm font-medium ${
                category === item.key ? 'text-white' : 'text-slate-400'
              }`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Ionicons name="search-outline" size={48} color="#475569" />
              <Text className="text-slate-500 mt-3 text-base">Aucun événement trouvé</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? <ActivityIndicator size="small" color="#f59e0b" style={{ padding: 16 }} /> : null
        }
      />
    </View>
  );
}
