'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, MapPin, Clock, Music, Trophy, Mic2, Theater, Film, Palette, PartyPopper, Wrench, Handshake, UtensilsCrossed } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { eventsAPI } from '@/lib/api';
import { Event, EventsResponse } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '@/components/ui/Card';

const features = [
  {
    icon: Calendar,
    title: 'Événements variés',
    description: 'Des concerts aux conférences, trouvez l\'événement parfait pour vous.',
  },
  {
    icon: Users,
    title: 'Communauté active',
    description: 'Rejoignez une communauté passionnée et rencontrez de nouvelles personnes.',
  },
  {
    icon: Sparkles,
    title: 'Expérience unique',
    description: 'Inscription simple, paiement sécurisé et accès instantané.',
  },
];

const categories = [
  { id: 'musique', name: 'Musique', icon: Music, color: 'from-pink-500 to-rose-600' },
  { id: 'sport', name: 'Sport', icon: Trophy, color: 'from-green-500 to-emerald-600' },
  { id: 'conference', name: 'Conférences', icon: Mic2, color: 'from-blue-500 to-indigo-600' },
  { id: 'theatre', name: 'Théâtre', icon: Theater, color: 'from-purple-500 to-violet-600' },
  { id: 'cinema', name: 'Cinéma', icon: Film, color: 'from-red-500 to-orange-600' },
  { id: 'exposition', name: 'Expositions', icon: Palette, color: 'from-cyan-500 to-teal-600' },
  { id: 'festival', name: 'Festivals', icon: PartyPopper, color: 'from-yellow-500 to-amber-600' },
  { id: 'atelier', name: 'Ateliers', icon: Wrench, color: 'from-slate-500 to-gray-600' },
  { id: 'networking', name: 'Networking', icon: Handshake, color: 'from-indigo-500 to-blue-600' },
  { id: 'gastronomie', name: 'Gastronomie', icon: UtensilsCrossed, color: 'from-orange-500 to-red-600' },
];

export default function Home() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, [checkAuth]);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ limit: 3 });
      const data = response.data as EventsResponse;
      setEvents(data.events || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-bg pattern-dots min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                La plateforme d&apos;événements n°1
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Découvrez des{' '}
                <span className="text-gradient">événements</span>{' '}
                extraordinaires
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg">
                Explorez des milliers d&apos;événements passionnants près de chez vous.
                Concerts, conférences, ateliers et bien plus encore vous attendent.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/events">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Explorer les événements
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link href="/register">
                    <Button variant="outline" size="lg">
                      Créer un compte
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />
                
                {/* Main card */}
                <Card variant="elevated" className="relative z-10 p-6">
                  <div className="aspect-video bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl mb-4 flex items-center justify-center">
                    <Calendar className="w-20 h-20 text-white/80" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Événement à la une
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Découvrez notre sélection d&apos;événements exceptionnels
                  </p>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Explorez par catégorie
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Trouvez facilement les événements qui correspondent à vos centres d&apos;intérêt
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/events?category=${category.id}`}>
                  <Card 
                    variant="bordered" 
                    hover 
                    className="p-4 text-center group"
                  >
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <category.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {category.name}
                    </h3>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Pourquoi choisir Evencia ?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Nous rendons la découverte et la participation aux événements simple et agréable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="bordered" className="p-6 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Événements à venir
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Ne manquez pas les prochains événements populaires
              </p>
            </div>
            <Link href="/events">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Voir tout
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="elevated" className="animate-pulse">
                  <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <Card variant="elevated" hover className="h-full">
                      <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center relative overflow-hidden">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <Calendar className="w-16 h-16 text-white/80" />
                        )}
                        {event.category && (
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                          {event.description || 'Aucune description disponible'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                          {event.event_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.event_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.price > 0 && (
                          <div className="mt-4 text-lg font-bold text-amber-600 dark:text-amber-400">
                            {event.price} €
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card variant="bordered" className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Aucun événement pour le moment
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Revenez bientôt pour découvrir de nouveaux événements !
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à découvrir des événements ?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Créez votre compte gratuitement et commencez à explorer des milliers d&apos;événements.
              </p>
              <Link href="/register">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-slate-100"
                >
                  Commencer maintenant
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
