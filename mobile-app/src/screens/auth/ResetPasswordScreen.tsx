import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const email = route.params?.email || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { resetPassword, isLoading } = useAuthStore();

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('One special character (!@#$%^&*)');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleResetPassword = async () => {
    // Validate code
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    // Validate password
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      Alert.alert('Password Requirements', 'Missing:\n- ' + passwordCheck.errors.join('\n- '));
      return;
    }

    // Confirm password match
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await resetPassword(email, code, newPassword);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo - Quadrant Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <View style={styles.quadrantGrid}>
                <View style={[styles.quadrant, styles.quadrantTopLeft]} />
                <View style={[styles.quadrant, styles.quadrantTopRight]} />
                <View style={[styles.quadrant, styles.quadrantBottomLeft]} />
                <View style={[styles.quadrant, styles.quadrantBottomRight]} />
                <View style={styles.centerDot} />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>6-Digit Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor={Colors.textLight}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              autoFocus
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Text style={styles.passwordHint}>
              Must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)
            </Text>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Back to <Text style={styles.linkTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  quadrantGrid: {
    width: 64,
    height: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  quadrant: {
    width: 28,
    height: 28,
    borderRadius: 5,
    margin: 2,
  },
  quadrantTopLeft: {
    backgroundColor: '#8b5cf6',
  },
  quadrantTopRight: {
    backgroundColor: '#3b82f6',
  },
  quadrantBottomLeft: {
    backgroundColor: '#10b981',
  },
  quadrantBottomRight: {
    backgroundColor: '#f59e0b',
  },
  centerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a202c',
    top: '50%',
    left: '50%',
    marginTop: -5,
    marginLeft: -5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  codeInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  linkTextBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
