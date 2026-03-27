import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/api/auth.service.js';
import {
    clearStoredAuthToken,
    getStoredAuthToken,
    setStoredAuthToken,
} from '@/lib/react-query.js';
import { queryKeys } from '@/hooks/queryKeys.js';

// ============================================================================
// INDIVIDUAL HOOKS (Queries & Mutations)
// ============================================================================

export const useUser = () => {
    return useQuery({
        queryKey: queryKeys.auth.me,
        queryFn: async () => {
            try {
                // Execute the actual API call
                return await authService.me();
            } catch (error) {
                // If the token is expired or invalid, destroy it to stop future attempts
                clearStoredAuthToken();
                throw error;
            }
        },
        retry: false, 
        // 1. Only run this query if a token actually exists
        enabled: !!getStoredAuthToken(), 
        // 2. Prevent infinite refetching when clicking around the app/window
        refetchOnWindowFocus: false, 
        // 3. Keep the user data "fresh" for 5 minutes so it doesn't refetch on every component mount
        staleTime: 1000 * 60 * 5, 
    });
};

// --- REGISTRATION & OTP ---
export const useRegister = () => {
    return useMutation({
        mutationFn: (userData) => authService.register(userData),
    });
};

export const useVerifyOtp = () => {
    return useMutation({
        mutationFn: (otpData) => authService.verifyOtp(otpData),
    });
};

// --- LOGIN (Standard & Google) ---
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: (data) => {
            // Save token from the response
            if (data.accessToken) {
                setStoredAuthToken(data.accessToken);
            }
            // Trigger a fetch to get the user's profile data
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        },
    });
};

export const useGoogleLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (googleData) => authService.googleLogin(googleData),
        onSuccess: (data) => {
            if (data.accessToken) {
                setStoredAuthToken(data.accessToken);
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        },
    });
};

export const useGithubLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (githubData) => authService.githubLogin(githubData),
        onSuccess: (data) => {
            if (data.accessToken) {
                setStoredAuthToken(data.accessToken);
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        },
    });
};

export const useRefreshToken = () => {
    return useMutation({
        mutationFn: () => authService.refreshToken(),
        onSuccess: (data) => {
            if (data.accessToken) {
                setStoredAuthToken(data.accessToken);
            }
        },
    });
};

// --- PASSWORD RESET FLOW ---
export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (emailData) => authService.forgotPassword(emailData),
    });
};

export const useVerifyResetOtp = () => {
    return useMutation({
        mutationFn: (otpData) => authService.verifyResetOtp(otpData),
    });
};

export const useResendOtp = ()=>{
    return useMutation({
        mutationFn: (emailData) => authService.resendOtp(emailData),
    });
}
export const useResetPassword = () => {
    return useMutation({
        mutationFn: (resetData) => authService.resetPassword(resetData),
    });
};

// --- LOGOUT ---
export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            clearStoredAuthToken();
            queryClient.setQueryData(queryKeys.auth.me, null);
            queryClient.clear(); // Clears all cached queries
        },
    });
};


// ============================================================================
// MAIN FACADE HOOK (For clean UI components)
// ============================================================================

export const useAuth = () => {
    // 1. Get current user state
    const {
        data: meResponse,
        isLoading: isUserLoading,
        isError,
        isFetching
    } = useUser();

    const user = meResponse?.user || null;

    // 2. Get primary mutations
    const loginMutation = useLogin();
    const logoutMutation = useLogout();
    const registerMutation = useRegister();
    const verifyOtpMutation = useVerifyOtp();
    const googleLoginMutation = useGoogleLogin();
    const githubLoginMutation = useGithubLogin();
    const refreshTokenMutation = useRefreshToken();
    const forgotPasswordMutation = useForgotPassword();
    const verifyResetOtpMutation = useVerifyResetOtp();
    const resetPasswordMutation = useResetPassword();
    const resendOtpMutation = useResendOtp();
    // 3. Derive authentication status
    const isAuthenticated = !!user && !isError;

    return {
        // User State
        user,
        isAuthenticated,
        isLoading: isUserLoading || isFetching, 

        // Login Actions & State
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync, 
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        // Google Login Actions & State
        googleLogin: googleLoginMutation.mutate,
        googleLoginAsync: googleLoginMutation.mutateAsync,
        isGoogleLoggingIn: googleLoginMutation.isPending,

        // GitHub Login Actions & State
        githubLogin: githubLoginMutation.mutate,
        githubLoginAsync: githubLoginMutation.mutateAsync,
        isGithubLoggingIn: githubLoginMutation.isPending,

        // Refresh Token Actions & State
        refreshToken: refreshTokenMutation.mutate,
        refreshTokenAsync: refreshTokenMutation.mutateAsync,
        isRefreshingToken: refreshTokenMutation.isPending,

        // Register Actions & State
        register: registerMutation.mutate,
        registerAsync: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,

        // Verify OTP Actions & State
        verifyOtp: verifyOtpMutation.mutate,
        verifyOtpAsync: verifyOtpMutation.mutateAsync,
        isVerifyingOtp: verifyOtpMutation.isPending,
        verifyOtpError: verifyOtpMutation.error,

        // Resend OTP Actions & State
        resendOtp: resendOtpMutation.mutate,
        resendOtpMutation: resendOtpMutation.mutate,
        resendOtpAsync: resendOtpMutation.mutateAsync,
        isResendingOtp: resendOtpMutation.isPending,
        resendOtpError: resendOtpMutation.error,

        // Password Reset Flow Actions & State
        forgotPassword: forgotPasswordMutation.mutate,
        forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
        isSendingForgotEmail: forgotPasswordMutation.isPending,

        verifyResetOtp: verifyResetOtpMutation.mutate,
        verifyResetOtpAsync: verifyResetOtpMutation.mutateAsync,
        isVerifyingResetOtp: verifyResetOtpMutation.isPending,

        resetPassword: resetPasswordMutation.mutate,
        resetPasswordAsync: resetPasswordMutation.mutateAsync,
        isResettingPassword: resetPasswordMutation.isPending,

        // Logout Actions & State
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
    };
};