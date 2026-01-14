'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  User, Mail, Calendar, Shield, Edit, Key, LogOut, 
  Ticket, MapPin, Clock, Euro, X, Check, AlertCircle 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authAPI, inscriptionsAPI, usersAPI } from '@/lib/api';
import { AxiosError } from 'axios';
import { ApiError, InscriptionWithEvent } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, logout, setUser } = useAuthStore();

  const [inscriptions, setInscriptions] = useState<InscriptionWithEvent[]>([]);
  const [isLoadingInscriptions, setIsLoadingInscriptions] = useState(true);
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setEditData({ name: user.name, email: user.email });
      fetchInscriptions();
    }
  }, [isAuthenticated, user, router]);

  const fetchInscriptions = async () => {
    try {
      const response = await inscriptionsAPI.getMyInscriptions();
      setInscriptions(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error);
    } finally {
      setIsLoadingInscriptions(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setEditError('');
    setEditSuccess('');

    try {
      const response = await usersAPI.updateMyProfile(editData);
      setUser(response.data);
      setEditSuccess('Profil mis à jour avec succès');
      setShowEditForm(false);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setEditError(axiosError.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setIsChangingPassword(false);
      return;
    }

    try {
      await authAPI.changePassword(passwordData);
      setPasswordSuccess('Mot de passe modifié avec succès');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setPasswordError(axiosError.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelInscription = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette inscription ?')) return;

    setCancellingId(id);
    try {
      await inscriptionsAPI.cancel(id);
      setInscriptions(inscriptions.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRoleBadge = (role: string) => {
    const roles = {
      admin: { label: 'Administrateur', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      organizer: { label: 'Organisateur', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      participant: { label: 'Participant', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    };
    return roles[role as keyof typeof roles] || roles.participant;
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return statuses[status as keyof typeof statuses] || statuses.pending;
  };

  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Profile Header */}
          <Card variant="elevated" className="p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-amber-500/25">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {user.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  {user.email}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {roleBadge.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    setShowEditForm(!showEditForm);
                    setShowPasswordForm(false);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Key className="w-4 h-4" />}
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    setShowEditForm(false);
                  }}
                >
                  Mot de passe
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </div>
            </div>

            {/* Edit Form */}
            {showEditForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Modifier mes informations
                </h3>

                {editError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {editSuccess}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      id="name"
                      label="Nom"
                      leftIcon={<User className="w-5 h-5" />}
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      required
                    />
                    <Input
                      id="email"
                      type="email"
                      label="Email"
                      leftIcon={<Mail className="w-5 h-5" />}
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={isUpdating}>
                      Enregistrer
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowEditForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Password Form */}
            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Changer le mot de passe
                </h3>

                {passwordError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Input
                    id="oldPassword"
                    type="password"
                    label="Mot de passe actuel"
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      id="newPassword"
                      type="password"
                      label="Nouveau mot de passe"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                    <Input
                      id="confirmPassword"
                      type="password"
                      label="Confirmer"
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={isChangingPassword}>
                      Changer le mot de passe
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </Card>

          {/* Profile Details */}
          <Card variant="elevated" className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Informations du compte
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nom</p>
                  <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                  <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Membre depuis</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.created_at
                      ? format(new Date(user.created_at), 'd MMMM yyyy', { locale: fr })
                      : 'Date inconnue'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Inscriptions</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {inscriptions.length} événement{inscriptions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Inscriptions History */}
          <Card variant="elevated" className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Historique des inscriptions
            </h2>

            {isLoadingInscriptions ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-pulse">
                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : inscriptions.length > 0 ? (
              <div className="space-y-4">
                {inscriptions.map((inscription) => {
                  const statusBadge = getStatusBadge(inscription.status);
                  const isPast = inscription.event_date && new Date(inscription.event_date) < new Date();
                  
                  return (
                    <div
                      key={inscription.id}
                      className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl transition-colors ${
                        isPast ? 'bg-slate-100 dark:bg-slate-800/30' : 'bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      {/* Image */}
                      <Link href={`/events/${inscription.event_id}`} className="flex-shrink-0">
                        <div className="w-full sm:w-24 h-24 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center overflow-hidden">
                          {inscription.event_image_url ? (
                            <img 
                              src={inscription.event_image_url} 
                              alt={inscription.event_title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Calendar className="w-10 h-10 text-white/50" />
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link href={`/events/${inscription.event_id}`}>
                            <h3 className={`font-semibold hover:text-amber-600 transition-colors ${
                              isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {inscription.event_title}
                            </h3>
                          </Link>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          {inscription.event_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(inscription.event_date), 'd MMM yyyy à HH:mm', { locale: fr })}
                              {isPast && ' (passé)'}
                            </span>
                          )}
                          {inscription.event_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {inscription.event_location}
                            </span>
                          )}
                          {inscription.event_price > 0 && (
                            <span className="flex items-center gap-1">
                              <Euro className="w-3.5 h-3.5" />
                              {inscription.event_price} €
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          Inscrit le {format(new Date(inscription.createdAt), 'd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>

                      {/* Actions */}
                      {inscription.status === 'confirmed' && !isPast && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            leftIcon={<X className="w-4 h-4" />}
                            onClick={() => handleCancelInscription(inscription.id)}
                            isLoading={cancellingId === inscription.id}
                          >
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Aucune inscription
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Vous n&apos;êtes inscrit à aucun événement pour le moment
                </p>
                <Link href="/events">
                  <Button>
                    Découvrir les événements
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
