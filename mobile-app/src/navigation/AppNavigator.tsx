import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TaskListScreen from '../screens/tasks/TaskListScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import TaskCreateScreen from '../screens/tasks/TaskCreateScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import ProjectTasksScreen from '../screens/projects/ProjectTasksScreen';
import GanttChartScreen from '../screens/projects/GanttChartScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import UpgradeScreen from '../screens/upgrade/UpgradeScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  MainTabs: undefined;
  TaskDetail: { taskId: string };
  TaskCreate: undefined;
  ProjectTasks: { projectId: string; projectName: string; projectColor: string };
  GanttChart: { projectId: string; projectName: string; projectColor: string };
  Upgrade: undefined;
};

export type MainTabsParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Projects: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabIcon name="grid" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size }) => <TabIcon name="check-square" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => <TabIcon name="folder" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <TabIcon name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component (you can replace with react-native-vector-icons later)
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
      }}
    />
  );
};

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ headerShown: true, title: 'Task Details' }}
            />
            <Stack.Screen
              name="TaskCreate"
              component={TaskCreateScreen}
              options={{ headerShown: true, title: 'Create Task' }}
            />
            <Stack.Screen
              name="ProjectTasks"
              component={ProjectTasksScreen}
              options={{ headerShown: true, title: 'Project Tasks' }}
            />
            <Stack.Screen
              name="GanttChart"
              component={GanttChartScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Upgrade"
              component={UpgradeScreen}
              options={{ headerShown: true, title: 'Upgrade' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
