import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../constants/colors';
import { useTaskStore } from '../../store/taskStore';
import { Task } from '../../types';
import * as ScreenOrientation from 'expo-screen-orientation';

type GanttChartScreenRouteProp = RouteProp<RootStackParamList, 'GanttChart'>;
type GanttChartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GanttChart'>;

interface GanttTask {
  task: Task;
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number;
  percentComplete: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_WIDTH = 120; // Width of each month column in pixels

export default function GanttChartScreen() {
  const route = useRoute<GanttChartScreenRouteProp>();
  const navigation = useNavigation<GanttChartScreenNavigationProp>();
  const { projectId, projectName, projectColor } = route.params;
  const { tasks } = useTaskStore();

  const projectTasks = tasks.filter((task) => task.projectId === projectId);

  // Enable landscape mode when screen mounts
  useEffect(() => {
    const unlockOrientation = async () => {
      await ScreenOrientation.unlockAsync();
    };
    unlockOrientation();

    // Lock back to portrait when leaving
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const ganttData = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) {
      return {
        items: [],
        minDate: new Date(),
        maxDate: new Date(),
        totalDays: 0,
      };
    }

    // Process tasks to get dates
    const items: GanttTask[] = projectTasks.map((task) => {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      // Parse start date
      if (task.startDate) {
        const dateStr = task.startDate.split('T')[0];
        startDate = new Date(dateStr + 'T00:00:00');
      }

      // Parse due date
      if (task.dueDate) {
        const dateStr = task.dueDate.split('T')[0];
        endDate = new Date(dateStr + 'T23:59:59');
      }

      // Calculate duration
      let durationDays = 0;
      if (startDate && endDate) {
        durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // If we only have start date, default end to 7 days later
      if (startDate && !endDate) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        durationDays = 7;
      }

      // If we only have due date, default start to 7 days before
      if (!startDate && endDate) {
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        durationDays = 7;
      }

      return {
        task,
        startDate,
        endDate,
        durationDays: Math.max(1, durationDays),
        percentComplete: task.progress || 0,
      };
    });

    // Calculate min and max dates
    const validDates = items
      .filter((item) => item.startDate)
      .map((item) => item.startDate as Date);

    if (validDates.length === 0) {
      const today = new Date();
      return {
        items,
        minDate: today,
        maxDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalDays: 30,
      };
    }

    const minDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
    const maxDate = new Date(
      Math.max(
        ...items
          .filter((item) => item.endDate)
          .map((item) => (item.endDate as Date).getTime())
      )
    );

    // Ensure minDate is before maxDate
    if (minDate >= maxDate) {
      maxDate.setDate(maxDate.getDate() + 30);
    }

    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Sort items by start date
    const sortedItems = [...items].sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.getTime() - b.startDate.getTime();
    });

    return {
      items: sortedItems,
      minDate,
      maxDate,
      totalDays,
    };
  }, [projectTasks]);

  const getProgressColor = (progress: number) => {
    if (progress === 0) return Colors.backgroundGray;
    if (progress < 33) return '#EF4444'; // red
    if (progress < 100) return '#EAB308'; // yellow
    return '#22C55E'; // green
  };

  // Helper function to get months between two dates
  const getMonthsBetween = (startDate: Date, endDate: Date) => {
    const months = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push({
        date: new Date(current),
        month: current.toLocaleString('default', { month: 'short' }),
        year: current.getFullYear(),
        monthIndex: current.getMonth(),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const monthLabels = useMemo(() => {
    return getMonthsBetween(ganttData.minDate, ganttData.maxDate);
  }, [ganttData.minDate, ganttData.maxDate]);

  const calculatePosition = (date: Date | null) => {
    if (!date) return 0;

    // Calculate position based on months from start
    const startYear = ganttData.minDate.getFullYear();
    const startMonth = ganttData.minDate.getMonth();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();

    const monthsDiff = (dateYear - startYear) * 12 + (dateMonth - startMonth);

    // Add fractional position within the month
    const daysInMonth = new Date(dateYear, dateMonth + 1, 0).getDate();
    const dayOfMonth = date.getDate();
    const fractionOfMonth = (dayOfMonth - 1) / daysInMonth;

    return (monthsDiff + fractionOfMonth) * MONTH_WIDTH;
  };

  const calculateWidth = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return 0;

    const startPos = calculatePosition(startDate);
    const endPos = calculatePosition(endDate);

    return Math.max(endPos - startPos, MONTH_WIDTH * 0.1); // Minimum 10% of month width
  };

  const totalResources = ganttData.items.reduce(
    (sum, item) => sum + (item.task.resourceCount || 0),
    0
  );
  const totalManpower = ganttData.items.reduce(
    (sum, item) => sum + (item.task.manhours || 0),
    0
  );

  const avgProgress =
    projectTasks.length > 0
      ? Math.round(
          projectTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / projectTasks.length
        )
      : 0;

  if (ganttData.items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Gantt Chart</Text>
            <Text style={styles.headerSubtitle}>{projectName}</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks with dates</Text>
          <Text style={styles.emptySubtext}>
            Add start dates or due dates to your tasks to see them on the timeline
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gantt Chart</Text>
          <Text style={styles.headerSubtitle}>{projectName}</Text>
        </View>
      </View>

      <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={true}>
        {/* Summary Cards */}
        <ScrollView horizontal style={styles.summaryRow} showsHorizontalScrollIndicator={false}>
          <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.summaryLabel}>Progress</Text>
            <Text style={[styles.summaryValue, { color: projectColor }]}>{avgProgress}%</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0F9FF' }]}>
            <Text style={styles.summaryLabel}>Resources</Text>
            <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{totalResources}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FAF5FF' }]}>
            <Text style={styles.summaryLabel}>Manhours</Text>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{totalManpower}h</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.summaryLabel}>Tasks</Text>
            <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{ganttData.items.length}</Text>
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>0-32%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EAB308' }]} />
            <Text style={styles.legendText}>33-99%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>100%</Text>
          </View>
        </View>

        {/* Gantt Chart */}
        <View style={styles.chartContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            persistentScrollbar={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.ganttContent}>
              {/* Timeline Header */}
              <View style={styles.timelineHeader}>
                <View style={styles.taskNameColumn}>
                  <Text style={styles.columnHeaderText}>Task</Text>
                </View>
                <View style={styles.dateLabelsContainer}>
                  {monthLabels.map((label, idx) => (
                    <View
                      key={idx}
                      style={styles.monthColumn}
                    >
                      <Text style={styles.monthLabel}>{label.month}</Text>
                      <Text style={styles.yearLabel}>{label.year}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Task Rows */}
              {ganttData.items.map((item, index) => (
                <View
                  key={item.task.id}
                  style={[styles.taskRow, index % 2 === 0 && styles.taskRowEven]}
                >
                  {/* Task Name */}
                  <View style={styles.taskNameColumn}>
                    <Text style={styles.taskName} numberOfLines={2}>
                      {item.task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Text style={styles.taskMetaText}>{item.percentComplete}%</Text>
                      {(item.task.resourceCount || 0) > 0 && (
                        <Text style={styles.taskMetaText}>👥 {item.task.resourceCount}</Text>
                      )}
                      {(item.task.manhours || 0) > 0 && (
                        <Text style={styles.taskMetaText}>⏱️ {item.task.manhours}h</Text>
                      )}
                    </View>
                  </View>

                  {/* Timeline Bar */}
                  <View
                    style={[
                      styles.timelineBarContainer,
                      { width: monthLabels.length * MONTH_WIDTH },
                    ]}
                  >
                    {/* Month grid lines */}
                    {monthLabels.map((_, idx) => (
                      <View
                        key={`grid-${idx}`}
                        style={[
                          styles.monthGridLine,
                          { left: idx * MONTH_WIDTH },
                        ]}
                      />
                    ))}

                    {/* Progress bar */}
                    {item.startDate && (
                      <View
                        style={[
                          styles.progressBar,
                          {
                            backgroundColor: getProgressColor(item.percentComplete),
                            left: calculatePosition(item.startDate),
                            width: calculateWidth(item.startDate, item.endDate),
                          },
                        ]}
                      >
                        {calculateWidth(item.startDate, item.endDate) > 60 && (
                          <Text style={styles.progressText}>{item.percentComplete}%</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainScrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chartContainer: {
    minHeight: 400,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  ganttContent: {
  },
  timelineHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  taskNameColumn: {
    width: 150,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    justifyContent: 'center',
  },
  columnHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateLabelsContainer: {
    flexDirection: 'row',
  },
  monthColumn: {
    width: MONTH_WIDTH,
    padding: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.backgroundGray,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  yearLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  taskRow: {
    flexDirection: 'row',
    minHeight: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  taskRowEven: {
    backgroundColor: '#FAFAFA',
  },
  taskName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskMetaText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  timelineBarContainer: {
    height: '100%',
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  monthGridLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  progressBar: {
    position: 'absolute',
    height: 28,
    top: '50%',
    marginTop: -14,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: MONTH_WIDTH * 0.1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
});
