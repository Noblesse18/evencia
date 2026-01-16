# TP3 - Créer des Custom Hooks React
## Durée : 1h30 | Niveau : ⭐⭐ Intermédiaire

---

## 🎯 Objectifs

À la fin de ce TP, tu sauras :
- Comprendre ce qu'est un custom hook React
- Créer des hooks réutilisables pour les appels API
- Réduire la duplication de code dans les composants
- Gérer les états de chargement et d'erreur

---

## 📚 Rappel théorique

### Qu'est-ce qu'un Custom Hook ?

Un **custom hook** est une fonction JavaScript qui :
- Commence par `use` (convention React)
- Peut utiliser d'autres hooks (useState, useEffect...)
- Permet de réutiliser de la logique entre composants

### Exemple simple

```tsx
// Sans hook - Code dupliqué dans chaque composant ❌
function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  // ...
}

// Avec hook - Logique centralisée ✅
function EventsPage() {
  const { events, isLoading, error, refetch } = useEvents();
  // ...
}
```

---

## 📋 Étapes du TP

### Étape 1 : Créer le dossier hooks

Crée le dossier `frontend/src/hooks/` et ajoute un fichier `index.ts` :

```
frontend/src/
├── hooks/
│   ├── index.ts
│   ├── useEvents.ts
│   ├── useEvent.ts
│   └── useInscriptions.ts
```

---

### Étape 2 : Créer le hook useEvents

Crée `frontend/src/hooks/useEvents.ts` :

```typescript
// frontend/src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { eventsAPI, EventFilters } from '@/lib/api';
import { Event, EventsResponse } from '@/lib/types';

interface UseEventsOptions {
  autoFetch?: boolean;  // Charger automatiquement au montage
  initialFilters?: EventFilters;
}

interface UseEventsReturn {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  filters: EventFilters;
  setFilters: (filters: EventFilters) => void;
  fetchEvents: (page?: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { autoFetch = true, initialFilters = {} } = options;

  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>(initialFilters);

  const fetchEvents = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.getAll({
        ...filters,
        page,
        limit: pagination.limit,
      });
      
      const data = response.data as EventsResponse;
      setEvents(data.events || []);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      console.error('Erreur useEvents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  const refetch = useCallback(() => {
    return fetchEvents(pagination.page);
  }, [fetchEvents, pagination.page]);

  // Charger au montage si autoFetch est true
  useEffect(() => {
    if (autoFetch) {
      fetchEvents(1);
    }
  }, [autoFetch]); // Ne pas inclure fetchEvents pour éviter les boucles

  // Recharger quand les filtres changent
  useEffect(() => {
    if (autoFetch) {
      fetchEvents(1);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    fetchEvents,
    refetch,
  };
}
```

---

### Étape 3 : Créer le hook useEvent (pour un seul événement)

Crée `frontend/src/hooks/useEvent.ts` :

```typescript
// frontend/src/hooks/useEvent.ts
import { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '@/lib/api';
import { Event } from '@/lib/types';

interface UseEventReturn {
  event: Event | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvent(eventId: string | null): UseEventReturn {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.getById(eventId);
      setEvent(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Événement introuvable';
      setError(message);
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}
```

---

### Étape 4 : Créer le hook useInscriptions

Crée `frontend/src/hooks/useInscriptions.ts` :

```typescript
// frontend/src/hooks/useInscriptions.ts
import { useState, useEffect, useCallback } from 'react';
import { inscriptionsAPI } from '@/lib/api';
import { InscriptionWithEvent } from '@/lib/types';
import { AxiosError } from 'axios';

interface UseInscriptionsReturn {
  inscriptions: InscriptionWithEvent[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  register: (eventId: string) => Promise<boolean>;
  cancel: (inscriptionId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  
  // États des actions
  isRegistering: boolean;
  isCancelling: string | null; // ID de l'inscription en cours d'annulation
}

export function useInscriptions(): UseInscriptionsReturn {
  const [inscriptions, setInscriptions] = useState<InscriptionWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const fetchInscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await inscriptionsAPI.getMyInscriptions();
      setInscriptions(response.data);
    } catch (err) {
      console.error('Erreur useInscriptions:', err);
      setError('Erreur lors du chargement des inscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (eventId: string): Promise<boolean> => {
    setIsRegistering(true);
    setError(null);

    try {
      await inscriptionsAPI.create(eventId);
      await fetchInscriptions(); // Recharger la liste
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(message);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [fetchInscriptions]);

  const cancel = useCallback(async (inscriptionId: string): Promise<boolean> => {
    setIsCancelling(inscriptionId);
    setError(null);

    try {
      await inscriptionsAPI.cancel(inscriptionId);
      setInscriptions(prev => prev.filter(i => i.id !== inscriptionId));
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Erreur lors de l\'annulation';
      setError(message);
      return false;
    } finally {
      setIsCancelling(null);
    }
  }, []);

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

  return {
    inscriptions,
    isLoading,
    error,
    register,
    cancel,
    refetch: fetchInscriptions,
    isRegistering,
    isCancelling,
  };
}
```

---

### Étape 5 : Créer le fichier index.ts

Crée `frontend/src/hooks/index.ts` :

```typescript
// frontend/src/hooks/index.ts
export { useEvents } from './useEvents';
export { useEvent } from './useEvent';
export { useInscriptions } from './useInscriptions';
```

---

### Étape 6 : Utiliser les hooks dans les composants

#### Exemple 1 : Page des événements

Modifie `frontend/src/app/events/page.tsx` :

**AVANT (logique dans le composant) :**
```tsx
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({...});
  const [filters, setFilters] = useState({...});

  useEffect(() => {
    fetchEvents(1);
  }, []);

  const fetchEvents = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await eventsAPI.getAll({...});
      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  // ... 50 lignes de logique de chargement
}
```

**APRÈS (avec hook) :**
```tsx
import { useEvents } from '@/hooks';

export default function EventsPage() {
  const { 
    events, 
    pagination, 
    isLoading, 
    error,
    filters,
    setFilters,
    fetchEvents 
  } = useEvents();

  // Plus de logique de chargement dans le composant !
  // Le composant se concentre sur le rendu

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const goToPage = (page: number) => {
    fetchEvents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ...reste du composant
}
```

#### Exemple 2 : Page de détail d'un événement

Modifie `frontend/src/app/events/[id]/page.tsx` :

```tsx
import { useEvent } from '@/hooks';
import { useInscriptions } from '@/hooks';

export default function EventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  
  // Utiliser les hooks
  const { event, isLoading, error, refetch } = useEvent(id);
  const { register, isRegistering } = useInscriptions();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const success = await register(id);
    if (success) {
      setIsRegistered(true);
      setSuccessMessage('Vous êtes inscrit à cet événement !');
      refetch(); // Recharger l'événement pour mettre à jour le compteur
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !event) {
    return <ErrorMessage message="Événement introuvable" />;
  }

  // ...reste du composant
}
```

---

### Étape 7 : Hook bonus - useOrganizerEvents

Crée `frontend/src/hooks/useOrganizerEvents.ts` :

```typescript
// frontend/src/hooks/useOrganizerEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '@/lib/api';
import { Event, OrganizerEventsResponse } from '@/lib/types';

interface UseOrganizerEventsReturn {
  events: (Event & { tickets_sold?: number })[];
  stats: {
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
  };
  isLoading: boolean;
  error: string | null;
  deleteEvent: (eventId: string) => Promise<boolean>;
  deletingId: string | null;
  refetch: () => Promise<void>;
}

export function useOrganizerEvents(): UseOrganizerEventsReturn {
  const [events, setEvents] = useState<(Event & { tickets_sold?: number })[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.getOrganizerEvents();
      const data = response.data as OrganizerEventsResponse;
      setEvents(data.events || []);
      setStats(data.stats || { totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 });
    } catch (err) {
      console.error('Erreur useOrganizerEvents:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    setDeletingId(eventId);

    try {
      await eventsAPI.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents - 1,
      }));
      return true;
    } catch (err) {
      console.error('Erreur suppression:', err);
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    stats,
    isLoading,
    error,
    deleteEvent,
    deletingId,
    refetch: fetchData,
  };
}
```

N'oublie pas de l'exporter dans `index.ts` :

```typescript
// frontend/src/hooks/index.ts
export { useEvents } from './useEvents';
export { useEvent } from './useEvent';
export { useInscriptions } from './useInscriptions';
export { useOrganizerEvents } from './useOrganizerEvents';
```

---

## ✅ Checklist de validation

- [ ] Le dossier `hooks/` est créé avec les fichiers
- [ ] `useEvents.ts` gère le chargement et les filtres
- [ ] `useEvent.ts` gère le chargement d'un événement
- [ ] `useInscriptions.ts` gère les inscriptions avec actions
- [ ] `index.ts` exporte tous les hooks
- [ ] Au moins un composant utilise un hook
- [ ] L'application fonctionne sans erreur

---

## 📝 Ce que tu as appris

1. **Les custom hooks** encapsulent la logique réutilisable
2. **La séparation des préoccupations** : le composant s'occupe du rendu, le hook de la logique
3. **useCallback** mémorise les fonctions pour éviter les re-renders
4. **La gestion d'état** (loading, error, data) est centralisée

---

## 🎯 Avantages des hooks

| Sans hooks | Avec hooks |
|------------|------------|
| 50+ lignes de logique par composant | 5 lignes d'import |
| Code dupliqué | Code réutilisable |
| Difficile à tester | Facile à tester |
| Composants lourds | Composants légers |

---

## ➡️ Étape suivante

Passe au [TP4 - Sécuriser l'application](./TP4_SECURITE.md) pour corriger les failles de sécurité.
