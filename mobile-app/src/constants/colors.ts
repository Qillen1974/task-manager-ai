export const Colors = {
  // Primary colors
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',

  // Eisenhower Matrix colors
  urgentImportant: '#EF4444',      // Red - Do First
  notUrgentImportant: '#3B82F6',   // Blue - Schedule
  urgentNotImportant: '#EAB308',   // Yellow - Delegate
  notUrgentNotImportant: '#9CA3AF', // Gray - Eliminate

  // Background colors
  background: '#FFFFFF',
  backgroundGray: '#F3F4F6',
  infoBackground: '#EFF6FF',

  // Text colors
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',

  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Other
  white: '#FFFFFF',
  black: '#000000',
};

export const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'urgent-important':
      return Colors.urgentImportant;
    case 'not-urgent-important':
      return Colors.notUrgentImportant;
    case 'urgent-not-important':
      return Colors.urgentNotImportant;
    case 'not-urgent-not-important':
      return Colors.notUrgentNotImportant;
    default:
      return Colors.textSecondary;
  }
};

export const getPriorityLabel = (priority?: string): string => {
  switch (priority) {
    case 'urgent-important':
      return 'Do First';
    case 'not-urgent-important':
      return 'Schedule';
    case 'urgent-not-important':
      return 'Delegate';
    case 'not-urgent-not-important':
      return 'Eliminate';
    default:
      return 'No Priority';
  }
};
