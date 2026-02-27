import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
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
      } catch {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleInscribe = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour vous inscrire.');
      return;
    }
    setInscribing(true);
    try {
      await apiClient.post('/inscriptions', { event_id: eventId });
      setAlreadyInscribed(true);
      Alert.alert('Succès', 'Vous êtes inscrit à cet événement !');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      Alert.alert('Erreur', msg);
    } finally {
      setInscribing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-slate-500 mt-3 text-base">Événement introuvable</Text>
      </View>
    );
  }

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';
  const timeStr = event.event_date
    ? new Date(event.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';
  const priceStr = event.price != null && Number(event.price) > 0
    ? `${Number(event.price).toFixed(2)} €`
    : 'Gratuit';
  const remaining = event.tickets_remaining ?? (
    event.max_tickets != null ? Math.max(0, event.max_tickets - (event.participants_count || 0)) : null
  );

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} className="w-full h-64" resizeMode="cover" />
        ) : (
          <View className="w-full h-64 bg-amber-500 items-center justify-center">
            <Ionicons name="calendar" size={60} color="#fff" />
          </View>
        )}

        {/* Back button overlay */}
        <TouchableOpacity
          className="absolute top-12 left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Content */}
        <View className="px-4 -mt-6">
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            {/* Category + Price */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-amber-50 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-amber-700">{event.category || '—'}</Text>
              </View>
              <Text className="text-lg font-bold text-amber-600">{priceStr}</Text>
            </View>

            <Text className="text-xl font-bold text-slate-900 mb-4">{event.title}</Text>

            {/* Metadata */}
            <View className="space-y-3">
              <InfoRow icon="calendar" color="#f59e0b" text={dateStr} />
              {timeStr ? <InfoRow icon="time" color="#f59e0b" text={`${timeStr}`} /> : null}
              <InfoRow icon="location" color="#f59e0b" text={event.location || '—'} />
              <InfoRow
                icon="people"
                color="#22c55e"
                text={`${event.participants_count || 0} participant(s)`}
              />
              {remaining != null && (
                <InfoRow
                  icon="ticket"
                  color={remaining > 0 ? '#3b82f6' : '#ef4444'}
                  text={remaining > 0 ? `${remaining} place(s) restante(s)` : 'Complet'}
                />
              )}
            </View>

            {/* Organizer */}
            {event.organizer && (
              <View className="mt-4 pt-4 border-t border-slate-100 flex-row items-center">
                <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                  <Text className="text-amber-700 font-bold">
                    {(event.organizer.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-medium text-slate-900">{event.organizer.name}</Text>
                  <Text className="text-xs text-slate-500">Organisateur</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl p-5 mt-3 shadow-sm">
            <Text className="text-base font-bold text-slate-900 mb-2">Description</Text>
            <Text className="text-sm text-slate-600 leading-5">
              {event.description || 'Aucune description.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            alreadyInscribed ? 'bg-green-500' : 'bg-amber-500'
          } ${inscribing ? 'opacity-70' : ''}`}
          onPress={handleInscribe}
          disabled={alreadyInscribed || inscribing}
          activeOpacity={0.8}
        >
          {inscribing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons
                name={alreadyInscribed ? 'checkmark-circle' : 'ticket'}
                size={20}
                color="#fff"
              />
              <Text className="text-white text-base font-semibold ml-2">
                {alreadyInscribed ? 'Inscrit' : 'S\'inscrire'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({ icon, color, text }) {
  return (
    <View className="flex-row items-center mb-2">
      <View
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{ backgroundColor: color + '15' }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text className="text-sm text-slate-700 ml-3 flex-1">{text}</Text>
    </View>
  );
}
