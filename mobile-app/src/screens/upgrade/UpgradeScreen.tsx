import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useInAppPurchases, MOBILE_UNLOCK_PRODUCT_ID } from '../../hooks/useInAppPurchases';
import { Colors } from '../../constants/colors';

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { subscription, mobileSubscription } = useAuthStore();
  const {
    isConnected,
    isLoading,
    isPurchasing,
    mobileUnlockProduct,
    purchaseProduct,
    restorePurchases,
    error,
  } = useInAppPurchases();

  const currentPlan = subscription?.plan || 'FREE';
  const hasMobileUnlock = mobileSubscription?.mobileUnlocked || mobileSubscription?.hasPremiumAccess;

  const handleMobileUnlockPurchase = () => {
    if (!isConnected) {
      Alert.alert('Error', 'Unable to connect to App Store. Please try again later.');
      return;
    }

    if (hasMobileUnlock) {
      Alert.alert('Already Unlocked', 'You already have Pro features unlocked!');
      return;
    }

    purchaseProduct(MOBILE_UNLOCK_PRODUCT_ID);
  };

  const handleRestorePurchases = () => {
    if (!isConnected) {
      Alert.alert('Error', 'Unable to connect to App Store. Please try again later.');
      return;
    }

    restorePurchases();
  };

  // Get display price (from App Store or fallback)
  const unlockPrice = mobileUnlockProduct?.price || '$4.99';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited projects, tasks, and more
          </Text>
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusValue}>
            {hasMobileUnlock ? 'Pro (Unlocked)' : 'Free'}
          </Text>
          {mobileSubscription?.accessReason === 'beta_mode' && (
            <Text style={styles.betaBadge}>Beta Access Active</Text>
          )}
          {mobileSubscription?.accessReason === 'beta_reward' && (
            <Text style={styles.betaBadge}>Beta Tester Reward</Text>
          )}
        </View>

        {/* Mobile Unlock - Main Purchase Option */}
        {Platform.OS === 'ios' && (
          <View style={[styles.planCard, styles.featuredPlan]}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Best Value</Text>
            </View>

            <Text style={styles.planName}>Pro Unlock</Text>
            <Text style={styles.planPrice}>{unlockPrice}</Text>
            <Text style={styles.planPriceNote}>One-time purchase</Text>

            <View style={styles.features}>
              <Text style={styles.feature}>✓ Unlimited projects</Text>
              <Text style={styles.feature}>✓ Unlimited tasks</Text>
              <Text style={styles.feature}>✓ Recurring tasks (up to 10)</Text>
              <Text style={styles.feature}>✓ Sub-projects (1 level)</Text>
              <Text style={styles.feature}>✓ Works on web too!</Text>
            </View>

            {hasMobileUnlock ? (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedBadgeText}>Already Unlocked</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.purchaseButton, (isPurchasing || isLoading) && styles.disabledButton]}
                onPress={handleMobileUnlockPurchase}
                disabled={isPurchasing || isLoading}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    Unlock for {unlockPrice}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Restore Purchases */}
        {Platform.OS === 'ios' && !hasMobileUnlock && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isPurchasing}
          >
            <Text style={styles.restoreButtonText}>
              Restore Previous Purchase
            </Text>
          </TouchableOpacity>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Close Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: Colors.infoBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  betaBadge: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  featuredPlan: {
    borderColor: Colors.primary,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planPriceNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  features: {
    marginBottom: 16,
  },
  feature: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  unlockedBadge: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unlockedBadgeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: Colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: Colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
