import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { useTaskStore } from '../../store/taskStore';
import { Task } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';

type TaskDetailRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen() {
  const route = useRoute<TaskDetailRouteProp>();
  const navigation = useNavigation<TaskDetailNavigationProp>();
  const { taskId } = route.params;

  const { tasks, updateTask, deleteTask, toggleComplete } = useTaskStore();
  const task = tasks.find((t) => t.id === taskId);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
  }, [task]);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setSaving(true);
    try {
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate?.toISOString(),
      });
      setIsEditing(false);
      Alert.alert('Success', 'Task updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    try {
      await toggleComplete(taskId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleClearDueDate = () => {
    setDueDate(undefined);
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'urgent-important':
        return '🔴 Do First';
      case 'not-urgent-important':
        return '🔵 Schedule';
      case 'urgent-not-important':
        return '🟡 Delegate';
      case 'not-urgent-not-important':
        return '⚪ Eliminate';
      default:
        return 'No Priority';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: task.completed ? Colors.success : Colors.warning },
            ]}
          >
            <Text style={styles.statusText}>
              {task.completed ? '✓ Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <Text style={styles.priorityText}>{getPriorityLabel(task.priority)}</Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
              editable={!isSaving}
            />
          ) : (
            <Text style={styles.valueText}>{task.title}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Task description"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSaving}
            />
          ) : (
            <Text style={styles.valueText}>
              {task.description || 'No description'}
            </Text>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          {isEditing ? (
            <>
              <View style={styles.dateButtonsContainer}>
                <TouchableOpacity
                  style={[styles.dateButton, styles.selectDateButton]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isSaving}
                >
                  <Text style={styles.dateButtonText}>
                    {dueDate
                      ? dueDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Select Due Date'}
                  </Text>
                </TouchableOpacity>
                {dueDate && (
                  <TouchableOpacity
                    style={[styles.dateButton, styles.clearDateButton]}
                    onPress={handleClearDueDate}
                    disabled={isSaving}
                  >
                    <Text style={styles.clearDateButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </>
          ) : (
            <Text style={styles.valueText}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'No due date'}
            </Text>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.metaText}>
            {new Date(task.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {task.completedAt && (
          <View style={styles.section}>
            <Text style={styles.label}>Completed</Text>
            <Text style={styles.metaText}>
              {new Date(task.completedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setTitle(task.title);
                setDescription(task.description || '');
                setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
                setShowDatePicker(false);
              }}
              disabled={isSaving}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.actionButtonText, { color: Colors.white }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                task.completed ? styles.incompleteButton : styles.completeButton,
              ]}
              onPress={handleToggleComplete}
            >
              <Text style={[styles.actionButtonText, { color: Colors.white }]}>
                {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[styles.actionButtonText, { color: Colors.white }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  priorityText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  selectDateButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  clearDateButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.white,
    flex: 0,
    paddingHorizontal: 16,
  },
  clearDateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  editButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  saveButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.white,
  },
  completeButton: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  incompleteButton: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning,
  },
  deleteButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
