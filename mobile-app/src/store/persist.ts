import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateCreator } from 'zustand';

export interface PersistOptions<T> {
  name: string;
  partialize?: (state: T) => Partial<T>;
}

export const persist = <T extends object>(
  config: StateCreator<T>,
  options: PersistOptions<T>
) => {
  return (set: any, get: any, api: any) => {
    const { name, partialize } = options;

    // Load persisted state
    AsyncStorage.getItem(name).then((storedState) => {
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          set(parsedState);
        } catch (error) {
          console.error(`Failed to parse persisted state for ${name}:`, error);
        }
      }
    });

    // Wrap set to persist on every state change
    const persistedSet: typeof set = (...args: any[]) => {
      set(...args);

      // Get the new state
      const state = get();
      const stateToPersist = partialize ? partialize(state) : state;

      // Save to AsyncStorage
      AsyncStorage.setItem(name, JSON.stringify(stateToPersist)).catch((error) => {
        console.error(`Failed to persist state for ${name}:`, error);
      });
    };

    return config(persistedSet, get, api);
  };
};
