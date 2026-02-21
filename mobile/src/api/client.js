import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// pour emulateur android : 10.0.2.2:5000
// pour appareil reel : ip de ma machine : 192.168.1.42/24

const API_BASE_URL = 'http://192.168.1.42:5000/api'; // ip wlan0 de mon pc linux

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
