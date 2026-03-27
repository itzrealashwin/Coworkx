import { api } from '@/lib/react-query.js';

export const authService = {
    register: async (data) => {
        const payload = {
            ...data,
            displayName: data.displayName || data.name,
        };
        const response = await api.post('/auth/register', payload);
        return response.data;
    },

    verifyOtp: async (data) => {
        const response = await api.post('/auth/verify-otp', data);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    googleLogin: async (data) => {
        const response = await api.post('/auth/google', data);
        return response.data;
    },

    githubLogin: async (data) => {
        const response = await api.post('/auth/github', data);
        return response.data;
    },

    refreshToken: async () => {
        const response = await api.post('/auth/refresh');
        return response.data;
    },

    forgotPassword: async (data) => {
        const response = await api.post('/auth/forgot-password', data);
        return response.data;
    },

    verifyResetOtp: async (data) => {
        const response = await api.post('/auth/verify-reset-otp', data);
        return response.data;
    },

    resetPassword: async (data) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
    
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    resendOtp: async (data) => {
        const response = await api.post('/auth/resend-otp', data);
        return response.data;
    }
};