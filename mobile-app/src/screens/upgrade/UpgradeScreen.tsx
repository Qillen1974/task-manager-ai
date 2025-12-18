import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { subscription } = useAuthStore();

  const currentPlan = subscription?.plan || 'FREE';

  const handleUpgrade = () => {
    // Open web app upgrade page in browser
    Linking.openURL('https://taskquadrant.io/upgrade');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock powerful features to boost your productivity
          </Text>
        </View>

        {/* Current Plan */}
        <View style={styles.currentPlanCard}>
          <Text style={styles.currentPlanLabel}>Current Plan</Text>
          <Text style={styles.currentPlanName}>{currentPlan}</Text>
        </View>

        {/* PRO Plan */}
        <View style={[styles.planCard, currentPlan === 'PRO' && styles.activePlan]}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>PRO</Text>
            {currentPlan === 'PRO' && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.planPrice}>$9.99/month</Text>
          <Text style={styles.planDescription}>Perfect for individuals and small teams</Text>

          <View style={styles.features}>
            <Text style={styles.featureTitle}>Features:</Text>
            <Text style={styles.feature}>✓ Up to 10 recurring tasks</Text>
            <Text style={styles.feature}>✓ 1 level of sub-projects</Text>
            <Text style={styles.feature}>✓ Up to 5 mind maps</Text>
            <Text style={styles.feature}>✓ Up to 50 nodes per mind map</Text>
            <Text style={styles.feature}>✓ Priority email support</Text>
            <Text style={styles.feature}>✓ Advanced analytics</Text>
          </View>

          {currentPlan !== 'PRO' && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ENTERPRISE Plan */}
        <View style={[styles.planCard, currentPlan === 'ENTERPRISE' && styles.activePlan]}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>ENTERPRISE</Text>
            {currentPlan === 'ENTERPRISE' && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.planPrice}>$29.99/month</Text>
          <Text style={styles.planDescription}>For teams that need unlimited power</Text>

          <View style={styles.features}>
            <Text style={styles.featureTitle}>Everything in PRO, plus:</Text>
            <Text style={styles.feature}>✓ Unlimited recurring tasks</Text>
            <Text style={styles.feature}>✓ Unlimited sub-project levels</Text>
            <Text style={styles.feature}>✓ Unlimited mind maps</Text>
            <Text style={styles.feature}>✓ Up to 200 nodes per mind map</Text>
            <Text style={styles.feature}>✓ Team collaboration</Text>
            <Text style={styles.feature}>✓ Priority phone support</Text>
            <Text style={styles.feature}>✓ Custom integrations</Text>
          </View>

          {currentPlan !== 'ENTERPRISE' && (
            <TouchableOpacity
              style={[styles.upgradeButton, styles.enterpriseButton]}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to ENTERPRISE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Note: Subscription management is currently only available on the web application.
            Tap "Upgrade" to open the upgrade page in your browser.
          </Text>
        </View>
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
  currentPlanCard: {
    backgroundColor: Colors.infoBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  currentPlanLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  activePlan: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoBackground,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  activeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  features: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
    paddingLeft: 8,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enterpriseButton: {
    backgroundColor: Colors.urgentImportant,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: Colors.infoBackground,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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
