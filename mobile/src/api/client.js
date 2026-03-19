import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// pour emulateur android : http://10.0.2.2:5000/api
// pour appareil reel : http://192.168.47.150:5000/api

const API_BASE_URL = 'http://192.168.47.150:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token a chaque requete
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
