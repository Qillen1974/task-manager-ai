import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkStatusCallback = (isOnline: boolean) => void;

class OfflineService {
  private listeners: Set<NetworkStatusCallback> = new Set();
  private isOnline: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    // Subscribe to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;

      if (online !== this.isOnline) {
        this.isOnline = online;
        this.notifyListeners(online);
      }
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
    });
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((callback) => callback(isOnline));
  }

  /**
   * Check if device is currently online
   */
  async checkOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  /**
   * Get current online status (synchronous)
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Wait for network to become online
   */
  waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOnline) {
        resolve();
        return;
      }

      const unsubscribe = this.subscribe((isOnline) => {
        if (isOnline) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
}

export const offlineService = new OfflineService();
