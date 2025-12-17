import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { useTaskStore } from '../../store/taskStore';
import { Task } from '../../types';
import { Swipeable } from 'react-native-gesture-handler';

type ProjectTasksRouteProp = RouteProp<RootStackParamList, 'ProjectTasks'>;
type ProjectTasksNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectTasks'>;

export default function ProjectTasksScreen() {
  const route = useRoute<ProjectTasksRouteProp>();
  const navigation = useNavigation<ProjectTasksNavigationProp>();
  const { projectId, projectName, projectColor } = route.params;

  const { tasks, isLoading, fetchTasks, deleteTask, toggleComplete } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await toggleComplete(taskId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  // Filter tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  const activeTasks = projectTasks.filter((task) => !task.completed);
  const completedTasks = projectTasks.filter((task) => task.completed);

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent-important':
        return '🔴';
      case 'not-urgent-important':
        return '🔵';
      case 'urgent-not-important':
        return '🟡';
      case 'not-urgent-not-important':
        return '⚪';
      default:
        return '⚫';
    }
  };

  const renderRightActions = (task: Task) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(task.id, task.title)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => handleTaskPress(item.id)}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxCompleted,
              ]}
              onPress={() => handleToggleComplete(item.id)}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.taskInfo}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.priorityIcon}>
                  {getPriorityIcon(item.priority)}
                </Text>
                <Text
                  style={[
                    styles.taskTitle,
                    item.completed && styles.taskTitleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </View>
              {item.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {item.dueDate && (
                <Text style={styles.dueDate}>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Project Header */}
      <View style={styles.projectHeader}>
        <View style={styles.projectHeaderLeft}>
          <View
            style={[styles.projectColorCircle, { backgroundColor: projectColor }]}
          />
          <Text style={styles.projectName}>{projectName}</Text>
        </View>
        <TouchableOpacity
          style={styles.ganttButton}
          onPress={() =>
            navigation.navigate('GanttChart', {
              projectId,
              projectName,
              projectColor,
            })
          }
        >
          <Text style={styles.ganttButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{projectTasks.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>
            {activeTasks.length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {completedTasks.length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={projectTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks in this project</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create your first task
              </Text>
            </View>
          }
        />
      )}

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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectColorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  ganttButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ganttButtonText: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  deleteActionText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
