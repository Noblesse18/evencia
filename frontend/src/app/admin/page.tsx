'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  UserCheck,
  CalendarCheck,
  Euro,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersAPI, eventsAPI } from '@/lib/api';
import { User, Event } from '@/lib/types';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.push('/events');
      return;
    }

    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        usersAPI.getAll(),
        eventsAPI.getAll(),
      ]);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    totalEvents: events.length,
    organizers: users.filter((u) => u.role === 'organizer').length,
    upcomingEvents: events.filter((e) => e.event_date && new Date(e.event_date) > new Date()).length,
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard Administrateur
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Vue d&apos;ensemble de la plateforme Evencia
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Utilisateurs totaux"
            value={stats.totalUsers}
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Événements"
            value={stats.totalEvents}
            icon={Calendar}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            title="Organisateurs"
            value={stats.organizers}
            icon={UserCheck}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            title="Événements à venir"
            value={stats.upcomingEvents}
            icon={CalendarCheck}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Derniers utilisateurs
                </h2>
                <Users className="w-5 h-5 text-slate-400" />
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : u.role === 'organizer'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Derniers événements
                </h2>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                        {event.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {event.event_date
                            ? format(new Date(event.event_date), 'd MMM yyyy', { locale: fr })
                            : 'Date non définie'}
                        </p>
                        <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                          {event.price > 0 ? `${event.price} €` : 'Gratuit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


