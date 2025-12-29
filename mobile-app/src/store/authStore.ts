import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { User, AuthState, MobileSubscription } from '../types';
import { calculateSubscriptionLimits } from '../utils/subscriptionLimits';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (updates: { firstName?: string; lastName?: string; email?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchMobileSubscription: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  subscription: null,
  subscriptionLimits: null,
  mobileSubscription: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);

      // Backend returns: { user, tokens: { accessToken, refreshToken }, subscription }
      const { user, tokens, subscription } = response;
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      // Store tokens securely (must be strings)
      await SecureStore.setItemAsync('authToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        subscription: subscription || null,
        isLoading: false,
      });

      // Calculate subscription limits after login
      if (subscription) {
        try {
          const recurringTaskCount = await apiClient.getRecurringTaskCount();
          const limits = calculateSubscriptionLimits(subscription.plan, recurringTaskCount);
          set({ subscriptionLimits: limits });
        } catch (error) {
          // Fallback: calculate without current count
          const limits = calculateSubscriptionLimits(subscription.plan);
          set({ subscriptionLimits: limits });
        }
      }

      // Fetch mobile-specific subscription and limits
      try {
        const mobileSubscription = await apiClient.getMobileSubscription();
        set({ mobileSubscription });

        // Auto-mark as beta tester if beta mode is active
        if (mobileSubscription.betaModeActive && !mobileSubscription.isBetaTester) {
          try {
            await apiClient.markAsBetaTester();
            // Refresh mobile subscription to get updated status
            const updatedMobileSub = await apiClient.getMobileSubscription();
            set({ mobileSubscription: updatedMobileSub });
          } catch (betaError) {
            // Beta tester marking failed - non-critical error
          }
        }
      } catch (mobileError) {
        // Mobile subscription fetch failed - non-critical error
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.register(email, password, firstName, lastName);

      // Backend returns: { user, tokens: { accessToken, refreshToken }, subscription }
      const { user, tokens, subscription } = response;
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      // Store tokens securely (must be strings)
      await SecureStore.setItemAsync('authToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        subscription: subscription || null,
        isLoading: false,
      });

      // Calculate subscription limits after registration
      if (subscription) {
        try {
          const recurringTaskCount = await apiClient.getRecurringTaskCount();
          const limits = calculateSubscriptionLimits(subscription.plan, recurringTaskCount);
          set({ subscriptionLimits: limits });
        } catch (error) {
          // Fallback: calculate without current count
          const limits = calculateSubscriptionLimits(subscription.plan);
          set({ subscriptionLimits: limits });
        }
      }

      // Fetch mobile-specific subscription and limits
      try {
        const mobileSubscription = await apiClient.getMobileSubscription();
        set({ mobileSubscription });

        // Auto-mark as beta tester if beta mode is active
        if (mobileSubscription.betaModeActive && !mobileSubscription.isBetaTester) {
          try {
            await apiClient.markAsBetaTester();
            // Refresh mobile subscription to get updated status
            const updatedMobileSub = await apiClient.getMobileSubscription();
            set({ mobileSubscription: updatedMobileSub });
          } catch (betaError) {
            // Beta tester marking failed - non-critical error
          }
        }
      } catch (mobileError) {
        // Mobile subscription fetch failed - non-critical error
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed';

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout. Is the backend server running?';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Cannot reach server at ' + error.config?.baseURL;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    // Clear tokens from secure storage
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      subscription: null,
      subscriptionLimits: null,
      mobileSubscription: null,
    });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (token && refreshToken) {
        // Verify token by fetching user data
        const user = await apiClient.getMe();
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Fetch subscription data and calculate limits
        try {
          const subscription = await apiClient.getCurrentSubscription();
          const recurringTaskCount = await apiClient.getRecurringTaskCount();
          const limits = calculateSubscriptionLimits(subscription.plan, recurringTaskCount);
          set({ subscription, subscriptionLimits: limits });
        } catch (error) {
          // Subscription fetch failed - non-critical error
        }

        // Fetch mobile-specific subscription
        try {
          const mobileSubscription = await apiClient.getMobileSubscription();
          set({ mobileSubscription });

          // Auto-mark as beta tester if beta mode is active
          if (mobileSubscription.betaModeActive && !mobileSubscription.isBetaTester) {
            try {
              await apiClient.markAsBetaTester();
              const updatedMobileSub = await apiClient.getMobileSubscription();
              set({ mobileSubscription: updatedMobileSub });
            } catch (betaError) {
              // Beta tester marking failed - non-critical error
            }
          }
        } catch (mobileError) {
          // Mobile subscription fetch failed - non-critical error
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      // Token is invalid, clear storage
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: { firstName?: string; lastName?: string; email?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await apiClient.updateProfile(updates);
      set({ user: updatedUser, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteAccount();
      // Clear tokens and logout
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        subscription: null,
        subscriptionLimits: null,
        mobileSubscription: null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchSubscription: async () => {
    try {
      const subscription = await apiClient.getCurrentSubscription();
      const recurringTaskCount = await apiClient.getRecurringTaskCount();
      const limits = calculateSubscriptionLimits(subscription.plan, recurringTaskCount);
      set({ subscription, subscriptionLimits: limits });
    } catch (error: any) {
      throw error;
    }
  },

  fetchMobileSubscription: async () => {
    try {
      const mobileSubscription = await apiClient.getMobileSubscription();
      set({ mobileSubscription });
    } catch (error: any) {
      throw error;
    }
  },
}));
