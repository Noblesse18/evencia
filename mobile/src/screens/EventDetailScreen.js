import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const eventId = route.params?.eventId;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscribing, setInscribing] = useState(false);
  const [alreadyInscribed, setAlreadyInscribed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/events/${eventId}`);
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleInscribe = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour vous inscrire.', [
        { text: 'OK', onPress: () => logout() },
      ]);
      return;
    }
    if (!eventId) return;
    setInscribing(true);
    try {
      await apiClient.post('/inscriptions', { event_id: eventId });
      setAlreadyInscribed(true);
      Alert.alert('Succès', 'Vous êtes inscrit à cet événement.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      Alert.alert('Erreur', msg);
    } finally {
      setInscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Événement introuvable.</Text>
      </View>
    );
  }

  const dateStr = event.event_date ? new Date(event.event_date).toLocaleString('fr-FR') : '';
  const priceStr = event.price != null && Number(event.price) > 0 ? `${Number(event.price).toFixed(2)} €` : 'Gratuit';
  const placesStr = event.tickets_remaining != null ? `${event.tickets_remaining} place(s) restante(s)` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.category}>{event.category || '—'}</Text>
      <Text style={styles.body}>{event.description || 'Aucune description.'}</Text>
      <Text style={styles.info}>📅 {dateStr}</Text>
      <Text style={styles.info}>📍 {event.location || '—'}</Text>
      <Text style={styles.info}>💰 {priceStr}</Text>
      {placesStr ? <Text style={styles.info}>🎫 {placesStr}</Text> : null}
      {event.organizer ? (
        <Text style={styles.info}>Organisateur : {event.organizer.name} ({event.organizer.email})</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, (alreadyInscribed || inscribing) && styles.buttonDisabled]}
        onPress={handleInscribe}
        disabled={alreadyInscribed || inscribing}
      >
        {inscribing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {alreadyInscribed ? 'Inscrit' : 'S\'inscrire'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#c00', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  category: { fontSize: 14, color: '#666', marginBottom: 12 },
  body: { fontSize: 16, color: '#333', marginBottom: 16 },
  info: { fontSize: 14, color: '#555', marginBottom: 6 },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
