export interface User {
  id: string;
  name: string;
  email: string;
  role: 'participant' | 'organizer' | 'admin';
  created_at: string;
}

export interface EventOrganizer {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  event_date: string;
  price: number;
  max_tickets: number | null;
  organizer_id: string;
  organizer?: EventOrganizer | null;
  photos: string[] | null;
  image_url: string | null;
  participants_count: number;
  tickets_remaining: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrganizerEventsResponse {
  events: (Event & { tickets_sold: number })[];
  stats: {
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
  };
}

export interface InscriptionWithEvent extends Inscription {
  event_title: string;
  event_description: string;
  event_location: string;
  event_date: string;
  event_price: number;
  event_category: string;
  event_image_url: string | null;
}

export interface Inscription {
  id: string;
  user_id: string;
  event_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  user_id: string;
  event_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  payment_method?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

export const CATEGORIES = [
  { value: 'musique', label: 'Musique', icon: '🎵' },
  { value: 'sport', label: 'Sport', icon: '⚽' },
  { value: 'conference', label: 'Conférence', icon: '🎤' },
  { value: 'theatre', label: 'Théâtre', icon: '🎭' },
  { value: 'cinema', label: 'Cinéma', icon: '🎬' },
  { value: 'exposition', label: 'Exposition', icon: '🖼️' },
  { value: 'festival', label: 'Festival', icon: '🎪' },
  { value: 'atelier', label: 'Atelier', icon: '🛠️' },
  { value: 'networking', label: 'Networking', icon: '🤝' },
  { value: 'gastronomie', label: 'Gastronomie', icon: '🍽️' },
  { value: 'autre', label: 'Autre', icon: '📌' },
] as const;
