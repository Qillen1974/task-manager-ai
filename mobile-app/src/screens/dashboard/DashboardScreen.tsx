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
      // Data load failed - non-critical
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

  const getDueTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      // Include tasks due today or overdue (past due date)
      return dueDate.getTime() <= today.getTime();
    });
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
        {/* Due Today Section */}
        {getDueTodayTasks().length > 0 && (
          <View style={styles.dueTodayContainer}>
            <View style={styles.dueTodayHeader}>
              <Text style={styles.dueTodayTitle}>📅 Due Today & Overdue</Text>
              <Text style={styles.dueTodayCount}>{getDueTodayTasks().length}</Text>
            </View>
            <View style={styles.dueTodayList}>
              {getDueTodayTasks().map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.dueTodayItem}
                  onPress={() => handleTaskPress(task.id)}
                >
                  <View style={styles.dueTodayItemContent}>
                    <View style={[
                      styles.priorityDot,
                      { backgroundColor: getPriorityColor(task.priority) }
                    ]} />
                    <Text style={styles.dueTodayTaskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                  </View>
                  <Text style={styles.dueTodayArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quadrants Container - Grid layout for tablets */}
        <View style={isAnyTablet && isLandscape ? styles.quadrantsGrid : styles.quadrantsStack}>
          {/* Urgent & Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('urgent-important', '🟣 Do First', Colors.urgentImportant)}
          </View>

          {/* Not Urgent & Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('not-urgent-important', '🔵 Schedule', Colors.notUrgentImportant)}
          </View>

          {/* Urgent & Not Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('urgent-not-important', '🟢 Delegate', Colors.urgentNotImportant)}
          </View>

          {/* Not Urgent & Not Important */}
          <View style={isAnyTablet && isLandscape ? styles.gridQuadrant : styles.stackQuadrant}>
            {renderQuadrant('not-urgent-not-important', '🟠 Eliminate', Colors.notUrgentNotImportant)}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  dueTodayContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dueTodayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ef4444',
  },
  dueTodayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  dueTodayCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueTodayList: {
    padding: 12,
  },
  dueTodayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dueTodayItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dueTodayTaskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  dueTodayArrow: {
    fontSize: 24,
    color: '#dc2626',
    fontWeight: '300',
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
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    top: 75, // Positioned near the header border line
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
    zIndex: 10,
  },
  fabText: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 32,
  },
});
