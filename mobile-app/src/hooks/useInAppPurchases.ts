import { useState, useEffect, useCallback } from 'react';
import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform, Alert } from 'react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

// Product ID must match what's configured in App Store Connect
export const MOBILE_UNLOCK_PRODUCT_ID = 'com.taskquadrant.mobile.unlock';

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface PurchaseState {
  isConnected: boolean;
  isLoading: boolean;
  products: Product[];
  isPurchasing: boolean;
  error: string | null;
}

export function useInAppPurchases() {
  const [state, setState] = useState<PurchaseState>({
    isConnected: false,
    isLoading: true,
    products: [],
    isPurchasing: false,
    error: null,
  });

  const { fetchMobileSubscription } = useAuthStore();

  // Initialize IAP connection
  useEffect(() => {
    let purchaseListener: InAppPurchases.Subscription | null = null;

    const initIAP = async () => {
      try {
        // Connect to the store
        await InAppPurchases.connectAsync();

        setState(prev => ({ ...prev, isConnected: true }));

        // Set up purchase listener
        purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            // Process successful purchases
            if (results) {
              for (const purchase of results) {
                if (!purchase.acknowledged) {
                  await handlePurchaseComplete(purchase);
                }
              }
            }
          } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
            setState(prev => ({ ...prev, isPurchasing: false }));
          } else {
            console.error('[IAP] Purchase error:', errorCode);
            setState(prev => ({
              ...prev,
              isPurchasing: false,
              error: `Purchase failed (code: ${errorCode})`
            }));
          }
        });

        // Load products
        await loadProducts();

      } catch (err) {
        console.error('[IAP] Failed to initialize:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to connect to App Store'
        }));
      }
    };

    if (Platform.OS === 'ios') {
      initIAP();
    } else {
      // Android not supported yet
      setState(prev => ({ ...prev, isLoading: false }));
    }

    // Cleanup
    return () => {
      if (purchaseListener) {
        purchaseListener.remove();
      }
      InAppPurchases.disconnectAsync().catch(() => {});
    };
  }, []);

  // Load available products from App Store
  const loadProducts = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { responseCode, results } = await InAppPurchases.getProductsAsync([
        MOBILE_UNLOCK_PRODUCT_ID,
      ]);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        const products: Product[] = results.map(product => ({
          productId: product.productId,
          title: product.title || 'Pro Unlock',
          description: product.description || 'Unlock unlimited projects, tasks, and more',
          price: product.price || '$4.99',
          priceAmountMicros: product.priceAmountMicros || 4990000,
          priceCurrencyCode: product.priceCurrencyCode || 'USD',
        }));

        setState(prev => ({ ...prev, products, isLoading: false }));
      } else {
        console.error('[IAP] Failed to load products, responseCode:', responseCode);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load products'
        }));
      }
    } catch (err) {
      console.error('[IAP] Error loading products:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load products'
      }));
    }
  };

  // Handle completed purchase - verify with backend
  const handlePurchaseComplete = async (purchase: InAppPurchases.InAppPurchase) => {
    try {
      console.log('[IAP] Processing purchase:', purchase.productId);

      // Get the receipt data
      const receiptData = purchase.transactionReceipt;

      if (!receiptData) {
        throw new Error('No receipt data');
      }

      // Verify with our backend
      const response = await apiClient.verifyMobileUnlock(receiptData, purchase.transactionId || '');

      if (response.mobileUnlocked) {
        // Success! Finish the transaction
        await InAppPurchases.finishTransactionAsync(purchase, true);

        // Refresh subscription status
        await fetchMobileSubscription();

        Alert.alert(
          'Purchase Successful!',
          'Thank you! Your Pro features have been unlocked.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Backend verification failed');
      }

    } catch (err) {
      console.error('[IAP] Failed to process purchase:', err);
      Alert.alert(
        'Purchase Error',
        'Your purchase was received but there was an error activating your features. Please contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setState(prev => ({ ...prev, isPurchasing: false }));
    }
  };

  // Initiate a purchase
  const purchaseProduct = useCallback(async (productId: string) => {
    if (!state.isConnected) {
      Alert.alert('Error', 'Not connected to App Store. Please try again.');
      return;
    }

    try {
      setState(prev => ({ ...prev, isPurchasing: true, error: null }));

      await InAppPurchases.purchaseItemAsync(productId);
      // The purchase listener will handle the result

    } catch (err: any) {
      console.error('[IAP] Purchase error:', err);
      setState(prev => ({
        ...prev,
        isPurchasing: false,
        error: err.message || 'Purchase failed'
      }));

      Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
    }
  }, [state.isConnected]);

  // Restore previous purchases
  const restorePurchases = useCallback(async () => {
    if (!state.isConnected) {
      Alert.alert('Error', 'Not connected to App Store. Please try again.');
      return;
    }

    try {
      setState(prev => ({ ...prev, isPurchasing: true, error: null }));

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
        // Find the mobile unlock purchase
        const unlockPurchase = results.find(p => p.productId === MOBILE_UNLOCK_PRODUCT_ID);

        if (unlockPurchase) {
          await handlePurchaseComplete(unlockPurchase);
          Alert.alert('Restored!', 'Your Pro features have been restored.');
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
        }
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }

    } catch (err) {
      console.error('[IAP] Restore error:', err);
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isPurchasing: false }));
    }
  }, [state.isConnected]);

  // Get the mobile unlock product
  const mobileUnlockProduct = state.products.find(p => p.productId === MOBILE_UNLOCK_PRODUCT_ID);

  return {
    ...state,
    mobileUnlockProduct,
    purchaseProduct,
    restorePurchases,
    refreshProducts: loadProducts,
  };
}
