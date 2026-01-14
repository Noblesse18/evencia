'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Euro, FileText, Image as ImageIcon, Tag, Ticket } from 'lucide-react';
import { eventsAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';
import { ApiError } from '@/lib/types';

const categories = [
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

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'autre',
    location: '',
    event_date: '',
    price: '',
    max_tickets: '',
    image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

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
    }
  }, [isAuthenticated, user, router]);

  const getFieldError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setErrors([]);

    try {
      const response = await eventsAPI.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        event_date: formData.event_date,
        price: formData.price ? parseFloat(formData.price) : 0,
        max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : null,
        image_url: formData.image_url || undefined,
      });

      router.push(`/events/${response.data.id}`);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      }
      setError(axiosError.response?.data?.message || 'Erreur lors de la création');
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || (user && user.role !== 'organizer' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux événements
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Créer un événement
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Remplissez les informations ci-dessous pour créer votre événement
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <Input
                id="title"
                label="Titre de l'événement *"
                placeholder="Ex: Concert de jazz au parc"
                leftIcon={<Calendar className="w-5 h-5" />}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={getFieldError('title')}
                required
              />

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    id="description"
                    rows={5}
                    placeholder="Décrivez votre événement en détail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    required
                  />
                </div>
                {getFieldError('description') && (
                  <p className="mt-1.5 text-sm text-red-500">{getFieldError('description')}</p>
                )}
              </div>

              {/* Image URL */}
              <Input
                id="image_url"
                label="URL de l'image (optionnel)"
                placeholder="https://exemple.com/image.jpg"
                leftIcon={<ImageIcon className="w-5 h-5" />}
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                error={getFieldError('image_url')}
              />
              {formData.image_url && (
                <div className="mt-2">
                  <p className="text-sm text-slate-500 mb-2">Aperçu :</p>
                  <img 
                    src={formData.image_url} 
                    alt="Aperçu" 
                    className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Location */}
              <Input
                id="location"
                label="Lieu *"
                placeholder="Ex: Parc de la Villette, Paris"
                leftIcon={<MapPin className="w-5 h-5" />}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={getFieldError('location')}
                required
              />

              {/* Date & Time */}
              <div>
                <label
                  htmlFor="event_date"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Date et heure *
                </label>
                <input
                  type="datetime-local"
                  id="event_date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                {getFieldError('event_date') && (
                  <p className="mt-1.5 text-sm text-red-500">{getFieldError('event_date')}</p>
                )}
              </div>

              {/* Price & Tickets */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="price"
                    type="number"
                    label="Prix (€)"
                    placeholder="0"
                    leftIcon={<Euro className="w-5 h-5" />}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    error={getFieldError('price')}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Laissez 0 pour un événement gratuit
                  </p>
                </div>

                <div>
                  <Input
                    id="max_tickets"
                    type="number"
                    label="Nombre de places"
                    placeholder="Illimité"
                    leftIcon={<Ticket className="w-5 h-5" />}
                    value={formData.max_tickets}
                    onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                    error={getFieldError('max_tickets')}
                    min="1"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Laissez vide pour illimité
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Link href="/events" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Créer l&apos;événement
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
