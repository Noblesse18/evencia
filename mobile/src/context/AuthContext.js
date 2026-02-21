import React, { createContext, useState, useEffect, useCallback} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage'

import apiClient from '../api/client';
export const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    const login = useCallback(async (email, password) => {
        const {data} = await apiClient.post('/auth/login', { email, password})
    
        await AsyncStorage.setItem('token', data.token);
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    }, []);

    useEffect(() => {
        let isMounted = true;
    
        async function loadStoredToken() {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              setLoading(false);
              return;
            }
            // 12. Token trouvé : on vérifie qu'il est encore valide et on récupère l'utilisateur
            const { data } = await apiClient.get('/auth/verify');
            if (isMounted && data.user) setUser(data.user);
          } catch (err) {
            // 13. Token expiré ou invalide : on le supprime
            await AsyncStorage.removeItem('token');
          } finally {
            if (isMounted) setLoading(false);
          }
        }
    
        loadStoredToken();
        return () => { isMounted = false };  // 14. Évite de mettre à jour l'état si le composant est démonté
    }, []);

    const value = {
        user,
        loading,
        login,
        logout,

    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider');
    return ctx;
}
