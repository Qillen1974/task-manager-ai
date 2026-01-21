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
import { useResponsive } from '../../hooks/useResponsive';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Path, Circle, Defs, Marker } from 'react-native-svg';

type GanttChartScreenRouteProp = RouteProp<RootStackParamList, 'GanttChart'>;
type GanttChartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GanttChart'>;

interface GanttTask {
  task: Task;
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number;
  percentComplete: number;
}

interface DependencyArrow {
  fromTaskId: string;
  toTaskId: string;
  fromRowIndex: number;
  toRowIndex: number;
  fromEndX: number;    // End edge of predecessor bar
  toStartX: number;    // Start edge of dependent bar
}

export default function GanttChartScreen() {
  const route = useRoute<GanttChartScreenRouteProp>();
  const navigation = useNavigation<GanttChartScreenNavigationProp>();
  const { projectId, projectName, projectColor } = route.params;
  const { tasks } = useTaskStore();
  const { isAnyTablet, getFontSize, getDimension } = useResponsive();

  const projectTasks = tasks.filter((task) => task.projectId === projectId);

  // Responsive dimensions
  const MONTH_WIDTH = getDimension(120, 160); // 120 for phone, 160 for tablet
  const TASK_NAME_COLUMN_WIDTH = getDimension(150, 200); // 150 for phone, 200 for tablet
  const ROW_HEIGHT = 60; // Height of each task row
  const TIMELINE_HEADER_HEIGHT = 50; // Fixed height for timeline header
  const PROGRESS_BAR_HEIGHT = 28; // Height of progress bars

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
    if (progress === 0) return '#9CA3AF'; // Medium gray - more visible than light gray
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

    return Math.max(endPos - startPos, 12); // Minimum 12px width
  };

  // Calculate dependency arrows
  const dependencyArrows = useMemo(() => {
    const arrows: DependencyArrow[] = [];
    const sortedItems = ganttData.items;

    // Create a map of task id to row index
    const taskIndexMap = new Map<string, number>();
    sortedItems.forEach((item, index) => {
      taskIndexMap.set(item.task.id, index);
    });

    // Find tasks with dependencies
    sortedItems.forEach((item, toRowIndex) => {
      const dependsOnId = item.task.dependsOnTaskId;
      if (dependsOnId && taskIndexMap.has(dependsOnId)) {
        const fromRowIndex = taskIndexMap.get(dependsOnId)!;
        const fromItem = sortedItems[fromRowIndex];

        // Calculate X positions (end edge of predecessor, start edge of dependent)
        if (fromItem.startDate && fromItem.endDate && item.startDate) {
          const fromBarStart = calculatePosition(fromItem.startDate);
          const fromBarWidth = calculateWidth(fromItem.startDate, fromItem.endDate);
          const fromEndX = fromBarStart + fromBarWidth; // End edge of predecessor bar

          const toStartX = calculatePosition(item.startDate); // Start edge of dependent bar

          arrows.push({
            fromTaskId: dependsOnId,
            toTaskId: item.task.id,
            fromRowIndex,
            toRowIndex,
            fromEndX,
            toStartX,
          });
        }
      }
    });

    return arrows;
  }, [ganttData.items, calculatePosition, calculateWidth]);

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
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#0d9488' }]} />
            <Text style={styles.legendText}>Dependency</Text>
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
              <View style={[styles.timelineHeader, { height: TIMELINE_HEADER_HEIGHT }]}>
                <View style={[styles.taskNameColumn, { width: TASK_NAME_COLUMN_WIDTH }]}>
                  <Text style={styles.columnHeaderText}>Task</Text>
                </View>
                <View style={styles.dateLabelsContainer}>
                  {monthLabels.map((label, idx) => (
                    <View
                      key={idx}
                      style={[styles.monthColumn, { width: MONTH_WIDTH }]}
                    >
                      <Text style={styles.monthLabel}>{label.month}</Text>
                      <Text style={styles.yearLabel}>{label.year}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Dependency Arrows SVG Overlay */}
              {dependencyArrows.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: TIMELINE_HEADER_HEIGHT, // Below timeline header
                    left: TASK_NAME_COLUMN_WIDTH,
                    width: monthLabels.length * MONTH_WIDTH,
                    height: ganttData.items.length * ROW_HEIGHT,
                    zIndex: 10,
                  }}
                  pointerEvents="none"
                >
                  <Svg
                    width={monthLabels.length * MONTH_WIDTH}
                    height={ganttData.items.length * ROW_HEIGHT}
                  >
                    {/* Arrow marker definition - matching web app exactly */}
                    <Defs>
                      <Marker
                        id="dependency-arrow"
                        markerWidth={6}
                        markerHeight={6}
                        refX={5}
                        refY={3}
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <Path d="M 0 0 L 6 3 L 0 6 Z" fill="#0d9488" />
                      </Marker>
                    </Defs>

                    {dependencyArrows.map((arrow, index) => {
                      // Calculate Y positions (center of each row = center of progress bar)
                      const fromY = arrow.fromRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                      const toY = arrow.toRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

                      // X positions (end edge of predecessor, start edge of dependent)
                      const fromX = arrow.fromEndX;
                      const toX = arrow.toStartX;

                      // Arrow should ALWAYS point RIGHT toward the dependent task
                      // Matching web app logic exactly
                      let pathD: string;
                      const arrowEndX = toX - 8; // Where arrowhead ends (8px before target bar start)

                      if (Math.abs(fromY - toY) < 5) {
                        // Same row - simple horizontal line
                        pathD = `M ${fromX} ${fromY} L ${arrowEndX} ${toY}`;
                      } else {
                        // Different rows - need to route the line properly
                        // Key: vertical line should be positioned so we approach target from the LEFT
                        // Position vertical line to the LEFT of the target
                        const verticalX = Math.min(fromX + 15, arrowEndX - 20);

                        // Path: start → go to vertical line X → drop to target row → go right to target
                        pathD = `M ${fromX} ${fromY} L ${verticalX} ${fromY} L ${verticalX} ${toY} L ${arrowEndX} ${toY}`;
                      }

                      return (
                        <React.Fragment key={`dep-${arrow.fromTaskId}-${arrow.toTaskId}-${index}`}>
                          {/* Connection line with arrow marker - matching web app */}
                          <Path
                            d={pathD}
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            markerEnd="url(#dependency-arrow)"
                          />
                          {/* Small circle at the predecessor (start of dependency) */}
                          <Circle
                            cx={fromX}
                            cy={fromY}
                            r={4}
                            fill="#0d9488"
                          />
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </View>
              )}

              {/* Task Rows */}
              {ganttData.items.map((item, index) => (
                <View
                  key={item.task.id}
                  style={[styles.taskRow, { height: ROW_HEIGHT }, index % 2 === 0 && styles.taskRowEven]}
                >
                  {/* Task Name */}
                  <View style={[styles.taskNameColumn, { width: TASK_NAME_COLUMN_WIDTH }]}>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    overflow: 'hidden',
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
