import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventsListScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const loadEvents = async () => {
    try {
      const { data } = await apiClient.get('/events', { params: { page: 1, limit: 20 } });
      setEvents(data.events || []);
    } catch (err) {
      console.warn('Erreur chargement events:', err.message);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const renderItem = ({ item }) => {
    const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR') : '';
    const priceStr = item.price != null && Number(item.price) > 0 ? `${Number(item.price).toFixed(2)} €` : 'Gratuit';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>{item.title || 'Sans titre'}</Text>
        <Text style={styles.cardInfo}>📅 {dateStr}</Text>
        <Text style={styles.cardInfo}>📍 {item.location || '—'}</Text>
        <Text style={styles.cardPrice}>{priceStr}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
        {user && (
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(); }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: '#2563eb', fontSize: 14 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cardInfo: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 },
});
