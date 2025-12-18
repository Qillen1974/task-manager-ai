import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabsParamList } from '../../navigation/AppNavigator';
import { apiClient } from '../../api/client';
import { Task, Project } from '../../types';
import { Colors, getPriorityColor, getPriorityLabel } from '../../constants/colors';
import { useTaskStore } from '../../store/taskStore';
import { useResponsive } from '../../hooks/useResponsive';

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isAnyTablet, isLandscape } = useResponsive();

  const loadData = async () => {
    try {
      const [projectsData] = await Promise.all([
        apiClient.getProjects(),
        fetchTasks(),
      ]);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh when screen comes into focus (e.g., after creating a task)
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTasksByPriority = (priority: string) => {
    return tasks.filter((task) => task.priority === priority && !task.completed);
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const renderQuadrant = (priority: string, label: string, color: string) => {
    const quadrantTasks = getTasksByPriority(priority);

    return (
      <View style={[styles.quadrant, { borderColor: color }]}>
        <View style={[styles.quadrantHeader, { backgroundColor: color }]}>
          <Text style={styles.quadrantTitle}>{label}</Text>
          <Text style={styles.quadrantCount}>{quadrantTasks.length}</Text>
        </View>
        <ScrollView style={styles.taskList}>
          {quadrantTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => handleTaskPress(task.id)}
            >
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
              </Text>
              {task.dueDate && (
                <Text style={styles.taskDate}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          {quadrantTasks.length === 0 && (
            <Text style={styles.emptyText}>No tasks</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Eisenhower Matrix</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quadrants Container - Grid layout for tablets */}
        <View style={isAnyTablet && isLandscape ? styles.quadrantsGrid : styles.quadrantsStack}>
          {/* Urgent & Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('urgent-important', '🔴 Do First', Colors.urgentImportant)}
          </View>

          {/* Not Urgent & Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('not-urgent-important', '🔵 Schedule', Colors.notUrgentImportant)}
          </View>

          {/* Urgent & Not Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('urgent-not-important', '🟡 Delegate', Colors.urgentNotImportant)}
          </View>

          {/* Not Urgent & Not Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('not-urgent-not-important', '⚪ Eliminate', Colors.notUrgentNotImportant)}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tasks.filter((t) => t.completed).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TaskCreate')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
  },
  quadrantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quadrantsStack: {
    flexDirection: 'column',
  },
  gridQuadrant: {
    width: '48.5%',
    marginBottom: 16,
  },
  stackQuadrant: {
    width: '100%',
  },
  quadrant: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  quadrantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  quadrantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  quadrantCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  taskList: {
    maxHeight: 200,
    padding: 12,
  },
  taskItem: {
    padding: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  taskDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 32,
  },
});
