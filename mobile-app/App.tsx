import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineIndicator from './src/components/OfflineIndicator';
import { useAuthStore } from './src/store/authStore';
import { notificationService } from './src/services/notificationService';
import { syncQueue } from './src/services/syncQueue';
import { useTaskStore } from './src/store/taskStore';
import { useProjectStore } from './src/store/projectStore';

export default function App() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Load stored authentication on app start
    loadStoredAuth();

    // Request notification permissions
    notificationService.requestPermissions();

    // Setup app state listener for auto-sync
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // When app comes to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground - triggering sync');

      // Process any pending sync operations
      await syncQueue.processQueue();

      // Refresh data from server
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (isAuthenticated) {
        useTaskStore.getState().fetchTasks();
        useProjectStore.getState().fetchProjects();
      }
    }

    appState.current = nextAppState;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AppNavigator />
      <OfflineIndicator />
    </GestureHandlerRootView>
  );
}
