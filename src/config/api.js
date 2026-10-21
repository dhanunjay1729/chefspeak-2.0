import { Capacitor } from '@capacitor/core';

const mobileApiBaseUrl = 'https://chefspeak-api.onrender.com';

// A phone's localhost is the phone itself, not the development machine.
export const apiBaseUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_MOBILE_API_BASE_URL || mobileApiBaseUrl
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
