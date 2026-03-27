import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

export const setStoredAuthToken = (token) => {
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes. During this time, 
      // subsequent requests will use the cached data without refetching.
      staleTime: 1000 * 60 * 2, 
      
      // Data remains in the garbage collection cache for 10 minutes 
      // after it's no longer being used by any component. (Note: if using v4, this is called cacheTime)
      gcTime: 1000 * 60 * 10, 
      
      // Prevents automatic refetching every time the user clicks back to the browser tab.
      refetchOnWindowFocus: false, 
      
      // If a query fails, it will retry exactly once before throwing an error.
      retry: 1, 
      
      // Automatically refetch if the user reconnects to the internet.
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations (POST, PUT, DELETE) generally shouldn't be retried automatically 
      // to avoid accidental duplicate submissions.
      retry: 0, 
    },
  },
});



// Create a customized Axios instance
export const api = axios.create({
  // Adjust this based on your bundler (e.g., process.env.REACT_APP_API_URL for Create React App)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  // Refresh token is provided through an HttpOnly cookie.
  withCredentials: true,
});

// ----------------------------------------------------------------------
// REQUEST INTERCEPTOR
// ----------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getStoredAuthToken(); 
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// ----------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that fall outside the range of 2xx cause this function to trigger
    if (error.response?.status === 401) {
      // 401 Unauthorized: Token is missing, invalid, or expired.
      console.warn('Unauthorized! Logging out...');
      clearStoredAuthToken();
      
      // Optional: Force a hard redirect to the login page
      // window.location.href = '/login'; 
    }
    
    // You can also handle 403 Forbidden or 500 Server Errors globally here
    
    return Promise.reject(error);
  }
);