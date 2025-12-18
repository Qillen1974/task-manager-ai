import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { useTaskStore } from '../../store/taskStore';
import { apiClient } from '../../api/client';
import { Priority, Project } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';

type TaskCreateNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskCreate'>;

const PRIORITY_OPTIONS: { label: string; value: Priority; color: string }[] = [
  { label: '🔴 Do First (Urgent & Important)', value: 'urgent-important', color: Colors.urgentImportant },
  { label: '🔵 Schedule (Not Urgent & Important)', value: 'not-urgent-important', color: Colors.notUrgentImportant },
  { label: '🟡 Delegate (Urgent & Not Important)', value: 'urgent-not-important', color: Colors.urgentNotImportant },
  { label: '⚪ Eliminate (Not Urgent & Not Important)', value: 'not-urgent-not-important', color: Colors.notUrgentNotImportant },
];

export default function TaskCreateScreen() {
  const navigation = useNavigation<TaskCreateNavigationProp>();
  const { createTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('urgent-important');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await apiClient.getProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!selectedProjectId) {
      Alert.alert('Error', 'No project available. Please create a project first.');
      return;
    }

    setIsCreating(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: selectedProjectId,
        completed: false,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
      });

      Alert.alert('Success', 'Task created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Create task error:', error);
      Alert.alert('Error', error.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (projects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No projects found</Text>
          <Text style={styles.emptySubtext}>
            Please create a project on the web app first before creating tasks.
          </Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        {/* Project */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Project <Text style={styles.required}>*</Text>
          </Text>
          {projects.length === 1 ? (
            <View style={styles.projectDisplay}>
              <View
                style={[styles.projectColor, { backgroundColor: projects[0].color }]}
              />
              <Text style={styles.projectName}>{projects[0].name}</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectOption,
                    selectedProjectId === project.id && styles.projectOptionSelected,
                  ]}
                  onPress={() => setSelectedProjectId(project.id)}
                  disabled={isCreating}
                >
                  <View
                    style={[styles.projectColor, { backgroundColor: project.color }]}
                  />
                  <Text
                    style={[
                      styles.projectOptionText,
                      selectedProjectId === project.id &&
                        styles.projectOptionTextSelected,
                    ]}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            editable={!isCreating}
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description (optional)"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!isCreating}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Priority <Text style={styles.required}>*</Text>
          </Text>
          {PRIORITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.priorityOption,
                priority === option.value && styles.priorityOptionSelected,
                { borderColor: option.color },
              ]}
              onPress={() => setPriority(option.value)}
              disabled={isCreating}
            >
              <View style={styles.priorityOptionContent}>
                <Text
                  style={[
                    styles.priorityOptionText,
                    priority === option.value && styles.priorityOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {priority === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
            disabled={isCreating}
          >
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString() : 'Select start date'}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          {startDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setStartDate(undefined)}
              disabled={isCreating}
            >
              <Text style={styles.clearDateText}>Clear</Text>
            </TouchableOpacity>
          )}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDueDatePicker(true)}
            disabled={isCreating}
          >
            <Text style={styles.dateButtonText}>
              {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          {dueDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setDueDate(undefined)}
              disabled={isCreating}
            >
              <Text style={styles.clearDateText}>Clear</Text>
            </TouchableOpacity>
          )}
          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowDueDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: Use the Eisenhower Matrix to prioritize your tasks effectively:
          </Text>
          <Text style={styles.infoItem}>• 🔴 Do First: Urgent and important</Text>
          <Text style={styles.infoItem}>• 🔵 Schedule: Important, not urgent</Text>
          <Text style={styles.infoItem}>• 🟡 Delegate: Urgent, not important</Text>
          <Text style={styles.infoItem}>• ⚪ Eliminate: Neither urgent nor important</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={handleCreate}
          disabled={isCreating || !title.trim()}
        >
          {isCreating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Task</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  projectDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  projectName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
  },
  projectOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoBackground,
  },
  projectOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  projectOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
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
  priorityOption: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  priorityOptionSelected: {
    borderWidth: 3,
  },
  priorityOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  priorityOptionTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: Colors.success,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: Colors.infoBackground,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  infoItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  dateIcon: {
    fontSize: 20,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
});
