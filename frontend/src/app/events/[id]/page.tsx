'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Euro,
  ArrowLeft,
  User,
  Share2,
  Heart,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
  Tag,
  Ticket,
  Users,
  AlertCircle,
} from 'lucide-react';
import { eventsAPI, inscriptionsAPI } from '@/lib/api';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculer canEdit seulement quand user ET event sont disponibles
  const isOwner = !!(user?.id && event?.organizer_id && user.id === event.organizer_id);
  const isAdmin = !!(user?.role === 'admin');
  const canEdit = isAuthenticated && (isOwner || isAdmin);
  
  // Vérifier si les places sont épuisées
  const isSoldOut = event != null && event.max_tickets != null && event.tickets_remaining != null && event.tickets_remaining <= 0;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
      setError('Événement introuvable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsRegistering(true);
    setError('');
    setSuccess('');

    try {
      await inscriptionsAPI.create(id);
      setIsRegistered(true);
      setSuccess('Vous êtes inscrit à cet événement !');
      // Recharger l'événement pour mettre à jour le compteur
      fetchEvent();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message === 'Déjà inscrit') {
        setIsRegistered(true);
        setSuccess('Vous êtes déjà inscrit à cet événement');
      } else {
        setError(axiosError.response?.data?.message || 'Erreur lors de l\'inscription');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    setIsDeleting(true);
    try {
      await eventsAPI.delete(id);
      router.push('/events');
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Erreur lors de la suppression');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Événement introuvable
        </h1>
        <Link href="/events">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Retour aux événements
          </Button>
        </Link>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Image */}
      <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-amber-400 to-orange-600 relative overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <Calendar className="w-32 h-32 text-white/20" />
          </div>
        )}

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/events">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/90 dark:bg-slate-900/90 hover:bg-white"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Retour
            </Button>
          </Link>
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button className="p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated" className="p-6 sm:p-8 relative z-10">
              {/* Price Badge & Edit Buttons */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                    {event.price > 0 ? (
                      <>
                        {event.price} <Euro className="w-4 h-4" />
                      </>
                    ) : (
                      'Gratuit'
                    )}
                  </span>
                  {event.category && (
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium capitalize flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {event.category}
                    </span>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <Link href={`/events/${id}/edit`}>
                      <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                        Modifier
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={handleDelete}
                      isLoading={isDeleting}
                    >
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6">
                {event.title}
              </h1>

              {/* Meta Info */}
              <div className="space-y-4 mb-8">
                {event.event_date && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(event.event_date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(event.event_date), "'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Nombre de participants */}
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.participants_count || 0} participant{(event.participants_count || 0) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-slate-500">inscrits à cet événement</p>
                  </div>
                </div>

                {/* Tickets restants */}
                {event.max_tickets !== null && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSoldOut 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Ticket className={`w-5 h-5 ${
                        isSoldOut 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isSoldOut ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {isSoldOut ? 'Complet' : `${event.tickets_remaining} place${(event.tickets_remaining || 0) !== 1 ? 's' : ''} restante${(event.tickets_remaining || 0) !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-sm text-slate-500">sur {event.max_tickets} places au total</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  À propos de cet événement
                </h2>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {event.description || 'Aucune description disponible pour cet événement.'}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card variant="elevated" className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Inscription
              </h3>

              {/* Sold out warning */}
              {isSoldOut && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cet événement est complet
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </div>
              )}

              {!isRegistered ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRegister}
                  isLoading={isRegistering}
                  disabled={isSoldOut}
                >
                  {!isAuthenticated 
                    ? 'Se connecter pour s\'inscrire' 
                    : isSoldOut 
                      ? 'Complet'
                      : "S'inscrire à l'événement"
                  }
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Vous êtes inscrit !
                  </p>
                </div>
              )}

              {/* Price summary */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Prix</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {event.price > 0 ? `${event.price} €` : 'Gratuit'}
                  </span>
                </div>
              </div>

              <hr className="my-6 border-slate-200 dark:border-slate-700" />

              {/* Organizer */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  Organisateur
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Organisateur
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Membre Evencia
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
