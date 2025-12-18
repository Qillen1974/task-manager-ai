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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password requirements to match backend
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter');
      return;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one special character (!@#$%^&*)');
      return;
    }

    try {
      console.log('Attempting registration with validated password');
      await register(email, password, firstName, lastName);
      // Navigation happens automatically via AppNavigator when isAuthenticated changes
    } catch (error: any) {
      console.error('Registration failed in RegisterScreen:', error);
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
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

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start organizing your tasks today</Text>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="First Name (Optional)"
              placeholderTextColor={Colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name (Optional)"
              placeholderTextColor={Colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Text style={styles.passwordHint}>
              Password must be at least 8 characters, contain one uppercase letter, and one special character (!@#$%^&*)
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor={Colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
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
    marginBottom: 20,
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
    width: 66,
    height: 66,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  quadrant: {
    width: 30,
    height: 30,
    borderRadius: 5,
    margin: 1.5,
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
    fontSize: 34,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
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
