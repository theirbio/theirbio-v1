export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
};
