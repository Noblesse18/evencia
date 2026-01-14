'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Search, Filter, Plus, Euro, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { eventsAPI } from '@/lib/api';
import { Event, EventsResponse } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const categories = [
  { id: 'all', name: 'Toutes' },
  { id: 'musique', name: 'Musique' },
  { id: 'sport', name: 'Sport' },
  { id: 'conference', name: 'Conférences' },
  { id: 'theatre', name: 'Théâtre' },
  { id: 'cinema', name: 'Cinéma' },
  { id: 'exposition', name: 'Expositions' },
  { id: 'festival', name: 'Festivals' },
  { id: 'atelier', name: 'Ateliers' },
  { id: 'networking', name: 'Networking' },
  { id: 'gastronomie', name: 'Gastronomie' },
  { id: 'autre', name: 'Autre' },
];

// Composant principal exporté avec Suspense
export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageSkeleton />}>
      <EventsPageContent />
    </Suspense>
  );
}

// Skeleton de chargement
function EventsPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-64 bg-white/20 rounded animate-pulse mb-4" />
          <div className="h-6 w-96 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} variant="elevated" className="animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contenu de la page (utilise useSearchParams)
function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    city: searchParams.get('city') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
  });

  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchEvents(1);
  }, []);

  const fetchEvents = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await eventsAPI.getAll({
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        city: filters.city || undefined,
        price_min: filters.price_min ? parseFloat(filters.price_min) : undefined,
        price_max: filters.price_max ? parseFloat(filters.price_max) : undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      });
      const data = response.data as EventsResponse;
      setEvents(data.events || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchEvents(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      city: '',
      price_min: '',
      price_max: '',
      date_from: '',
      date_to: '',
    });
    setTimeout(() => fetchEvents(1), 0);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchEvents(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tous les événements
            </h1>
            <p className="text-white/80 max-w-2xl">
              Découvrez et participez aux événements qui vous passionnent
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-8 -mt-12">
          <Card variant="elevated" className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Rechercher</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtres
                </Button>
                {isAuthenticated && isOrganizer && (
                  <Link href="/events/create">
                    <Button leftIcon={<Plus className="w-4 h-4" />}>
                      Créer
                    </Button>
                  </Link>
                )}
              </div>
            </form>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Paris"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Prix min */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Prix min (€)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={filters.price_min}
                      onChange={(e) => handleFilterChange('price_min', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Prix max */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Prix max (€)
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      min="0"
                      value={filters.price_max}
                      onChange={(e) => handleFilterChange('price_max', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Date début */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      À partir du
                    </label>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Date fin */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Jusqu&apos;au
                    </label>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={applyFilters}>Appliquer les filtres</Button>
                  <Button variant="ghost" onClick={resetFilters} leftIcon={<X className="w-4 h-4" />}>
                    Réinitialiser
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  handleFilterChange('category', cat.id);
                  setTimeout(() => fetchEvents(1), 0);
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  filters.category === cat.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {pagination.total} événement{pagination.total !== 1 ? 's' : ''} trouvé{pagination.total !== 1 ? 's' : ''}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="elevated" className="animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <Card variant="elevated" hover className="h-full">
                      {/* Image/Placeholder */}
                      <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-600 relative overflow-hidden">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white/30" />
                          </div>
                        )}
                        {/* Category Badge */}
                        {event.category && (
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {event.category}
                          </span>
                        )}
                        {/* Price Badge */}
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center gap-1">
                            {event.price > 0 ? (
                              <>
                                {event.price} <Euro className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              'Gratuit'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">
                          {event.title}
                        </h3>
                        
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                          {event.description || 'Aucune description disponible'}
                        </p>

                        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                          {event.event_date && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span>
                                {format(new Date(event.event_date), "EEEE d MMMM yyyy 'à' HH:mm", {
                                  locale: fr,
                                })}
                              </span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-amber-500" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>{event.participants_count || 0} participant{(event.participants_count || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Précédent
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card variant="bordered" className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Essayez de modifier vos filtres ou revenez plus tard
            </p>
            <Button onClick={resetFilters} variant="outline">
              Réinitialiser les filtres
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
