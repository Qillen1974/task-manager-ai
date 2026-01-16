import { useCallback } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TASKS_COMPLETED_KEY = 'tasksCompletedCount';
const REVIEW_REQUESTED_KEY = 'reviewRequested';
const TASKS_THRESHOLD = 5; // Ask for review after completing 5 tasks

export function useStoreReview() {
  const checkAndRequestReview = useCallback(async () => {
    // Only on iOS for now
    if (Platform.OS !== 'ios') return;

    try {
      // Check if we already requested a review
      const reviewRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
      if (reviewRequested === 'true') return;

      // Get current count
      const countStr = await AsyncStorage.getItem(TASKS_COMPLETED_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const newCount = count + 1;

      // Save new count
      await AsyncStorage.setItem(TASKS_COMPLETED_KEY, newCount.toString());

      // Check if we should request review
      if (newCount >= TASKS_THRESHOLD) {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          // Small delay to let the user see the task completion first
          setTimeout(async () => {
            await StoreReview.requestReview();
            // Mark as requested so we don't ask again
            await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, 'true');
          }, 1500);
        }
      }
    } catch (error) {
      console.warn('Error checking store review:', error);
    }
  }, []);

  const onTaskCompleted = useCallback(() => {
    checkAndRequestReview();
  }, [checkAndRequestReview]);

  return { onTaskCompleted };
}
