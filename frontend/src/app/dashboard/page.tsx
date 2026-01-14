'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Euro,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Ticket,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { eventsAPI } from '@/lib/api';
import { Event, OrganizerEventsResponse } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const [events, setEvents] = useState<(Event & { tickets_sold?: number })[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.push('/events');
      return;
    }

    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const response = await eventsAPI.getOrganizerEvents();
      const data = response.data as OrganizerEventsResponse;
      setEvents(data.events || []);
      setStats(data.stats || { totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    setDeletingId(id);
    try {
      await eventsAPI.delete(id);
      setEvents(events.filter((e) => e.id !== id));
      setStats((prev) => ({
        ...prev,
        totalEvents: prev.totalEvents - 1,
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard Organisateur
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gérez vos événements et suivez vos statistiques
            </p>
          </div>
          <Link href="/events/create">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Créer un événement
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Événements créés"
            value={stats.totalEvents}
            icon={Calendar}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            title="Tickets vendus"
            value={stats.totalTicketsSold}
            icon={Ticket}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            title="Revenu total"
            value={`${stats.totalRevenue.toFixed(2)} €`}
            icon={Euro}
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatCard
            title="Taux de remplissage"
            value={events.length > 0 ? `${Math.round((stats.totalTicketsSold / (events.reduce((acc, e) => acc + (e.max_tickets || 100), 0))) * 100)}%` : '0%'}
            icon={BarChart3}
            color="bg-gradient-to-br from-purple-500 to-violet-600"
          />
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Mes événements
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {events.length} événement{events.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-pulse">
                    <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {/* Image */}
                    <div className="w-full sm:w-32 h-32 sm:h-24 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <Calendar className="w-10 h-10 text-white/50" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {event.title}
                          </h3>
                          {event.category && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium mt-1 capitalize">
                              {event.category}
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {event.price > 0 ? `${event.price} €` : 'Gratuit'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {event.event_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(event.event_date), 'd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">{event.location}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-green-500" />
                          {event.participants_count || 0} inscrit{(event.participants_count || 0) !== 1 ? 's' : ''}
                          {event.max_tickets && ` / ${event.max_tickets}`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Link href={`/events/${event.id}`} className="flex-1 sm:flex-none">
                        <Button variant="ghost" size="sm" className="w-full" leftIcon={<Eye className="w-4 h-4" />}>
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/events/${event.id}/edit`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit className="w-4 h-4" />}>
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(event.id)}
                        isLoading={deletingId === event.id}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Aucun événement
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Vous n&apos;avez pas encore créé d&apos;événement
                </p>
                <Link href="/events/create">
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Créer mon premier événement
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Revenue Chart Placeholder */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <Card variant="elevated" className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Aperçu des ventes
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map((event) => {
                  const soldPercentage = event.max_tickets 
                    ? Math.round(((event.participants_count || 0) / event.max_tickets) * 100)
                    : 0;
                  
                  return (
                    <div key={event.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <h4 className="font-medium text-slate-900 dark:text-white line-clamp-1 mb-2">
                        {event.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          {event.participants_count || 0} / {event.max_tickets || '∞'} places
                        </span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {((event.participants_count || 0) * (event.price || 0)).toFixed(2)} €
                        </span>
                      </div>
                      {event.max_tickets && (
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              soldPercentage >= 90 ? 'bg-red-500' :
                              soldPercentage >= 70 ? 'bg-amber-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
