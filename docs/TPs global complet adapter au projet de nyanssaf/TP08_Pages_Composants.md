# TP08 - Pages et Composants React

## 🎯 Objectifs

- Créer les pages principales de l'application
- Utiliser React Query pour les appels API
- Implémenter la pagination et les filtres
- Créer des composants réutilisables

**Durée estimée :** 3 heures

---

## 📋 Prérequis

- TP07 terminé
- Authentification fonctionnelle

---

## Étape 1 : Page d'accueil (Home)

### 1.1 Créer src/pages/Home.jsx

```javascript
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import eventsService from '../services/events';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';

function Home() {
  // Récupérer les événements à venir
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'home'],
    queryFn: () => eventsService.getEvents({ 
      limit: 6, 
      sortBy: 'start_datetime', 
      sortOrder: 'asc' 
    }),
  });

  return (
    <div className="min-h-screen">
      {/* Section Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300 mb-8">
              <SparklesIcon className="w-4 h-4 text-primary-400" />
              <span>Découvrez des événements près de chez vous</span>
            </div>

            {/* Titre */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              Créez des souvenirs
              <br />
              <span className="gradient-text">inoubliables</span>
            </h1>

            {/* Sous-titre */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-400 mb-10">
              Connectez-vous avec des personnes qui partagent vos passions. 
              Trouvez des événements, créez des expériences uniques.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/events" className="btn-primary px-8 py-3 text-base">
                Explorer les événements
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/register" className="btn-secondary px-8 py-3 text-base">
                Créer un événement
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">500+</div>
                <div className="text-sm text-neutral-400 mt-1">Événements</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">10k+</div>
                <div className="text-sm text-neutral-400 mt-1">Utilisateurs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">50+</div>
                <div className="text-sm text-neutral-400 mt-1">Villes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title text-white mb-4">
              Tout pour organiser ou participer
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Des ateliers intimes aux grands festivals, OneLastEvent facilite 
              la découverte et la gestion de tous types d'événements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 text-center hover:border-primary-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-3">
                Création facile
              </h3>
              <p className="text-neutral-400 text-sm">
                Créez des pages d'événements en quelques minutes. 
                Définissez la capacité, le prix, et laissez les inscriptions affluer.
              </p>
            </div>

            <div className="glass p-8 text-center hover:border-accent-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-7 h-7 text-accent-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-3">
                Communauté active
              </h3>
              <p className="text-neutral-400 text-sm">
                Construisez votre communauté. Connectez-vous avec les participants 
                et développez votre audience.
              </p>
            </div>

            <div className="glass p-8 text-center hover:border-green-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-3">
                Découverte intelligente
              </h3>
              <p className="text-neutral-400 text-sm">
                Trouvez des événements qui correspondent à vos intérêts. 
                Filtrez par date, lieu, prix et découvrez des pépites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Événements à venir */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title text-white mb-2">Événements à venir</h2>
              <p className="text-neutral-400">Ne manquez pas ces expériences</p>
            </div>
            <Link to="/events" className="btn-secondary hidden sm:flex items-center gap-2">
              Voir tout
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : data?.events?.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass">
              <CalendarIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">Aucun événement disponible pour le moment.</p>
              <Link to="/events/create" className="link text-sm mt-2 inline-block">
                Créez le premier →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
```

---

## Étape 2 : Composant EventCard

### 2.1 Créer src/components/EventCard.jsx

```javascript
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function EventCard({ event }) {
  const isFree = parseFloat(event.price) === 0;
  const spotsLeft = event.remainingSpots || event.capacity - (event.currentParticipants || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Link to={`/events/${event.id}`} className="group">
      <article className="card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-white/20" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isFree ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-500/90 text-white rounded-lg">
                Gratuit
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-white/90 text-neutral-900 rounded-lg">
                {event.price} {event.currency}
              </span>
            )}
            {isFull && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500/90 text-white rounded-lg">
                Complet
              </span>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Date */}
          <div className="flex items-center gap-2 text-primary-400 text-sm mb-2">
            <CalendarIcon className="w-4 h-4" />
            <time dateTime={event.startDatetime}>
              {format(new Date(event.startDatetime), "EEE d MMM · HH'h'mm", { locale: fr })}
            </time>
          </div>

          {/* Titre */}
          <h3 className="font-display font-semibold text-lg text-white group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>

          {/* Lieu */}
          {event.location && (
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-3">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <UserGroupIcon className="w-4 h-4" />
              <span>
                {spotsLeft > 0 ? `${spotsLeft} places restantes` : 'Complet'}
              </span>
            </div>

            {/* Organisateur */}
            {event.organizer && (
              <div className="flex items-center gap-2">
                {event.organizer.avatarUrl ? (
                  <img
                    src={event.organizer.avatarUrl}
                    alt={event.organizer.fullName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center">
                    <span className="text-xs text-white">
                      {event.organizer.fullName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default EventCard;
```

---

## Étape 3 : Page Liste des Événements

### 3.1 Créer src/pages/EventList.jsx

```javascript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import eventsService from '../services/events';
import EventCard from '../components/EventCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

function EventList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Récupérer les paramètres de l'URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const location = searchParams.get('location') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'start_datetime';

  // États locaux pour les filtres (avant soumission)
  const [searchInput, setSearchInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  // Requête API avec React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', { page, search, location, minPrice, maxPrice, sortBy }],
    queryFn: () =>
      eventsService.getEvents({
        page,
        limit: 12,
        search: search || undefined,
        location: location || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        sortOrder: 'asc',
      }),
  });

  // Mettre à jour les paramètres d'URL
  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Retourner à la page 1 quand les filtres changent
    if (!updates.page) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  // Soumettre la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({
      search: searchInput,
      location: locationInput,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    });
    setShowFilters(false);
  };

  // Effacer les filtres
  const clearFilters = () => {
    setSearchInput('');
    setLocationInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const hasActiveFilters = search || location || minPrice || maxPrice;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Explorer les événements
          </h1>
          <p className="text-neutral-400">
            Trouvez votre prochaine expérience inoubliable
          </p>
        </div>

        {/* Recherche et Filtres */}
        <div className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              {/* Champ de recherche */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher des événements..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input pl-11"
                />
              </div>

              {/* Bouton filtres */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center gap-2 ${
                  hasActiveFilters ? 'border-primary-500 text-primary-400' : ''
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Filtres</span>
              </button>

              {/* Bouton rechercher */}
              <button type="submit" className="btn-primary">
                Rechercher
              </button>
            </div>

            {/* Filtres étendus */}
            {showFilters && (
              <div className="mt-4 p-6 glass">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Lieu</label>
                    <input
                      type="text"
                      placeholder="Ville ou lieu"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Prix min (€)</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Prix max (€)</label>
                    <input
                      type="number"
                      placeholder="Illimité"
                      min="0"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Trier par</label>
                    <select
                      value={sortBy}
                      onChange={(e) => updateParams({ sortBy: e.target.value })}
                      className="input"
                    >
                      <option value="start_datetime">Date</option>
                      <option value="price">Prix</option>
                      <option value="created_at">Récemment ajouté</option>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Résultats */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-16 glass">
            <p className="text-red-400 mb-2">Erreur de chargement</p>
            <p className="text-neutral-400 text-sm">{error.message}</p>
          </div>
        ) : data?.events?.length > 0 ? (
          <>
            <p className="text-neutral-400 text-sm mb-6">
              {data.total} événement{data.total > 1 ? 's' : ''} trouvé{data.total > 1 ? 's' : ''}
            </p>

            {/* Grille d'événements */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={(newPage) => updateParams({ page: newPage.toString() })}
            />
          </>
        ) : (
          <div className="text-center py-16 glass">
            <p className="text-neutral-400 mb-2">Aucun événement trouvé</p>
            <p className="text-neutral-500 text-sm">
              Essayez de modifier vos filtres
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventList;
```

---

## Étape 4 : Composant Pagination

### 4.1 Créer src/components/Pagination.jsx

```javascript
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2">
      {/* Bouton précédent */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {/* Numéros de page */}
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`min-w-[40px] h-10 rounded-lg text-sm transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : page === '...'
              ? 'text-neutral-500 cursor-default'
              : 'hover:bg-white/10'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Bouton suivant */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
}

export default Pagination;
```

---

## Étape 5 : Pages supplémentaires

### 5.1 Créer src/pages/NotFound.jsx

```javascript
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-display font-bold gradient-text mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page non trouvée
        </h2>
        <p className="text-neutral-400 mb-8 max-w-md">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <HomeIcon className="w-5 h-5" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
```

### 5.2 Créer src/pages/Profile.jsx (base)

```javascript
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import usersService from '../services/users';

function Profile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
  });

  const updateMutation = useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success('Profil mis à jour');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erreur de mise à jour');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="font-display text-3xl font-bold text-white mb-8">
          Mon profil
        </h1>

        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                className="input min-h-[100px]"
                placeholder="Parlez-nous de vous..."
              />
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
```

### 5.3 Créer les placeholders pour les autres pages

Créez des fichiers simples pour `DashboardUser.jsx`, `DashboardOrganizer.jsx`, `EventDetails.jsx`, `CreateEvent.jsx` avec un contenu minimal similaire à `NotFound.jsx` pour que l'application compile.

---

## ✅ Checklist de validation

- [ ] La page Home affiche les événements à venir
- [ ] EventCard affiche correctement les informations
- [ ] EventList permet la recherche et le filtrage
- [ ] La pagination fonctionne
- [ ] La page 404 s'affiche pour les routes inconnues
- [ ] La page Profile permet de modifier le profil

---

## 🔗 Prochaine étape

Continuez avec le [TP09 - Docker et Déploiement](./TP09_Docker.md)
