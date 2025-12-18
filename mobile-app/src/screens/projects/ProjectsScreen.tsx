import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabsParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { useProjectStore } from '../../store/projectStore';
import { useTaskStore } from '../../store/taskStore';
import { Project } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

type ProjectsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Projects'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const PROJECT_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Deep Orange
];

export default function ProjectsScreen() {
  const navigation = useNavigation<ProjectsNavigationProp>();
  const { projects, isLoading, fetchProjects, createProject, deleteProject } =
    useProjectStore();
  const { tasks } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const { getColumns, isAnyTablet, getModalWidth } = useResponsive();
  const numColumns = getColumns(1, 2, 3); // 1 for phone, 2 for tablet, 3 for large tablet

  useEffect(() => {
    fetchProjects();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setIsCreating(true);
    try {
      await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        color: selectedColor,
      });

      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedColor(PROJECT_COLORS[0]);
      Alert.alert('Success', 'Project created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || '');
    setSelectedColor(project.color);
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setIsUpdating(true);
    try {
      await useProjectStore.getState().updateProject(editingProject.id, {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        color: selectedColor,
      });

      setShowEditModal(false);
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedColor(PROJECT_COLORS[0]);
      Alert.alert('Success', 'Project updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"? All tasks in this project will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter((task) => task.projectId === projectId).length;
  };

  const getProjectActiveTaskCount = (projectId: string) => {
    return tasks.filter(
      (task) => task.projectId === projectId && !task.completed
    ).length;
  };

  const handleViewProjectTasks = (project: Project) => {
    navigation.navigate('ProjectTasks', {
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
    });
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const renderProjectItem = (item: Project, level: number = 0): JSX.Element => {
    const taskCount = item.taskCount ?? getProjectTaskCount(item.id);
    const activeTaskCount = getProjectActiveTaskCount(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedProjects.has(item.id);

    // Calculate flex basis for grid layout
    const gridItemStyle = numColumns > 1 && level === 0
      ? { flex: 1, marginHorizontal: 8 }
      : {};

    return (
      <View key={item.id} style={gridItemStyle}>
        <TouchableOpacity
          style={[
            styles.projectCard,
            level > 0 && { marginLeft: level * 20, marginBottom: 8 },
          ]}
          onPress={() => handleViewProjectTasks(item)}
          activeOpacity={0.7}
        >
          <View style={styles.projectHeader}>
            <View style={styles.projectHeaderLeft}>
              {hasChildren && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleProjectExpansion(item.id);
                  }}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
              )}
              <View
                style={[styles.projectColorCircle, { backgroundColor: item.color }]}
              />
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.projectActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditProject(item);
                }}
              >
                <Text style={styles.editButtonText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(item.id, item.name);
                }}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.projectStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{taskCount}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{activeTaskCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{taskCount - activeTaskCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <Text style={styles.tapHint}>Tap to view tasks →</Text>
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {item.children!.map((child) => renderProjectItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderProject = ({ item }: { item: Project }) => {
    return renderProjectItem(item, 0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <Text style={styles.headerSubtitle}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </Text>
      </View>

      {/* Project List */}
      {isLoading && projects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          key={numColumns} // Force re-render when columns change
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create your first project
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Project Modal */}
      <Modal
        visible={showCreateModal}
        animationType={isAnyTablet ? 'fade' : 'slide'}
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isAnyTablet && styles.modalOverlayTablet]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, isAnyTablet && styles.modalOverlayTablet]}>
              <View style={[
                styles.modalContent,
                isAnyTablet && { width: getModalWidth(), borderRadius: 20, maxHeight: '80%' }
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create New Project</Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    <Text style={styles.modalClose}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Project Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Project Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={newProjectName}
                      onChangeText={setNewProjectName}
                      placeholder="Enter project name"
                      editable={!isCreating}
                      autoFocus
                      returnKeyType="next"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newProjectDescription}
                      onChangeText={setNewProjectDescription}
                      placeholder="Enter project description (optional)"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!isCreating}
                    />
                  </View>

                  {/* Color Picker */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Color</Text>
                    <View style={styles.colorPicker}>
                      {PROJECT_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => setSelectedColor(color)}
                          disabled={isCreating}
                        >
                          {selectedColor === color && (
                            <Text style={styles.colorCheckmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={handleCreateProject}
                    disabled={isCreating || !newProjectName.trim()}
                  >
                    {isCreating ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.createButtonText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        visible={showEditModal}
        animationType={isAnyTablet ? 'fade' : 'slide'}
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, isAnyTablet && styles.modalOverlayTablet]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, isAnyTablet && styles.modalOverlayTablet]}>
              <View style={[
                styles.modalContent,
                isAnyTablet && { width: getModalWidth(), borderRadius: 20, maxHeight: '80%' }
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Project</Text>
                  <TouchableOpacity
                    onPress={() => setShowEditModal(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.modalClose}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Project Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Project Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={newProjectName}
                      onChangeText={setNewProjectName}
                      placeholder="Enter project name"
                      editable={!isUpdating}
                      autoFocus
                      returnKeyType="next"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newProjectDescription}
                      onChangeText={setNewProjectDescription}
                      placeholder="Enter project description (optional)"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!isUpdating}
                    />
                  </View>

                  {/* Color Picker */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Color</Text>
                    <View style={styles.colorPicker}>
                      {PROJECT_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => setSelectedColor(color)}
                          disabled={isUpdating}
                        >
                          {selectedColor === color && (
                            <Text style={styles.colorCheckmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowEditModal(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={handleUpdateProject}
                    disabled={isUpdating || !newProjectName.trim()}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.createButtonText}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  projectCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  expandButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  projectColorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.infoBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 18,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 36,
    color: Colors.textSecondary,
    lineHeight: 36,
  },
  modalBody: {
    padding: 20,
  },
  modalBodyContent: {
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
    minHeight: 80,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text,
  },
  colorCheckmark: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
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
});
