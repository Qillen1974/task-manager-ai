import { useState, useEffect } from "react";
import { getCurrentSession } from "./auth";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      // Make the key user-specific
      const session = getCurrentSession();
      const userKey = session ? `${session.userId}_${key}` : key;

      const item = window.localStorage.getItem(userKey);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isClient) {
        // Make the key user-specific
        const session = getCurrentSession();
        const userKey = session ? `${session.userId}_${key}` : key;
        window.localStorage.setItem(userKey, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
